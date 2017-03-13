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

//create a instance of the contentful client
const client = contentful.createClient({space: CONTENTFUL_SPACE_ID, accessToken: CONTENTFUL_ACCESS_TOKEN})

/**
 * parse a list of blog posts
 * @param apiResponse
 * @returns {Array}
 */
function parseBlogPostList(apiResponse) {
    return apiResponse.items.map(parseBlogPost)
}

/**
 * parse a single blog entry
 * @param blogPost
 * @returns {{title: (string), teaserText: (string), featureImage: ({title, url}|{title: string, url: string}), body: (string), tags: [string], slug: (string)}}
 */
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

/**
 * extract the relevant data of an image
 * @param imageData
 * @returns {{title: (string), url: (string)}}
 */
function parseImage(imageData) {
    return {
        title: imageData.fields.title,
        url: imageData.fields.file.url
    }
}

express()
    .set('view engine', 'dust')
    .set('views', __dirname + '/templates')
    .engine('dust', consolidate.dust)
    .use(express.static('static'))

    .get('/', (req, res, next) => {
        // get all blog entries, parse them and render them into the template 'List'
        client
            .getEntries({content_type: 'blogPost'})
            .then(parseBlogPostList)
            .then(result => res.render('List', {entries: result.length > 0 ? result : null}))
            .catch(next)
    })
    .get('/post/:slug', (req, res, next) => {
        //get a single blogpost identified by ':slug', parse it and render it into the template 'Detail'
        client
            .getEntries({content_type: 'blogPost', 'fields.slug': req.params.slug})
            .then(result => {
                if (result.total === 0)  return next(new Error(`blogpost "${slug}" not found`))

                return parseBlogPost(result.items[0])
            })
            .then(result => res.render('Detail', {entry: result}))
            .catch(next)
    })
    .use((error, req, res, next) => {
        //if something goes wrong this error handler catches the error and prints an error message via the 'Error' template
        res.render('Error', {message: error.message})
    })
    .listen(8888)