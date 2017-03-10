'use strict'

const contentful = require('contentful')
const marked = require('marked')
const express = require('express')
const consolidate = require('consolidate')

// -----------------------------------
// --- enter your credentials here ---
// -----------------------------------
const CONTENTFUL_SPACE_ID = '8xyid523mdgd'
const CONTENTFUL_ACCESS_TOKEN = '8b21ec77bc02fa235cd3c2b3affa2d7ad2feb5ee92d3c0c951c95b77e8b64949'

const client = contentful.createClient({space: CONTENTFUL_SPACE_ID, accessToken: CONTENTFUL_ACCESS_TOKEN})

function parseBlogPostList(apiResponse) {
    return apiResponse.items.map(parseBlogPost)
}

function parseBlogPost(blogPost) {
    let fields = blogPost.fields

    return {
        title: fields.title,
        teaserText: fields.teaserText,
        featureImage: parseImage(fields.featureImage),
        body: marked(fields.body),
        tags: fields.tags,
        slug: fields.slug
    }
}

function parseImage(image) {
    return {
        title: image.fields.title,
        url: image.fields.file.url
    }
}

express()
    .set('view engine', 'dust')
    .set('views', __dirname + '/templates')
    .engine('dust', consolidate.dust)
    .use(express.static('static'))

    .get('/', (req, res, next) => {
        client
            .getEntries({content_type: 'blogPost'})
            .then(parseBlogPostList)
            .then(result => res.render('List', {entries: result.length > 0 ? result : null}))
            .catch(next)
    })
    .get('/post/:slug', (req, res, next) => {
        client
            .getEntries({content_type: 'blogPost', 'fields.slug': req.params.slug})
            .then(result => {
                if (result.total === 0) next(new Error(`blogpost "${slug}" not found`))

                return parseBlogPost(result.items[0])
            })
            .then(result => res.render('Detail', {entry: result}))
            .catch(next)
    })
    .use((error, req, res, next) => res.render('Error', {message: error.message}))
    .listen(8888)