'use strict'

const contentful = require('contentful')
const marked = require('marked')

class Client {
    constructor(entriesPerPage, spaceId, accessToken) {
        this._contentful = contentful.createClient({space: spaceId, accessToken: accessToken})

        this._entriesPerPage = entriesPerPage
    }

    getListOverview(page) {
        page = page || 0

        let offset = page * this._entriesPerPage
        return this._contentful
            .getEntries({content_type: 'blogPost', limit: this._entriesPerPage, skip: offset})
            .then(result => {
                if (result.overall === 0) return []

                return result.items.map(entry => this._parseBlogPost(entry))
            })
    }

    getBlogDetail(slug) {
        return this._contentful
            .getEntries({content_type: 'blogPost', 'fields.slug': slug})
            .then(result => {
                if (result.total === 0) return Promise.reject(`blogpost "${slug}" not found`)

                return this._parseBlogPost(result.items[0])
            })
    }

    _parseBlogPost(blogPost) {
        let fields = blogPost.fields
        
        return {
            title: fields.title,
            teaserText: fields.teaserText,
            featureImage: this._parseImage(fields.featureImage),
            body: marked(fields.body),
            tags: fields.tags,
            slug: fields.slug
        }
    }

    _parseImage(image) {
        return {
            title: image.fields.title,
            url: image.fields.file.url
        }
    }
}

module.exports = Client