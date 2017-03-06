'use strict'

const express = require('express')
const consolidate = require('consolidate')

const CFClient = require('./lib/Client')


// -----------------------------------
// --- enter your credentials here ---
// -----------------------------------
const CONTENTFUL_SPACE_ID = '8xyid523mdgd'
const CONTENTFUL_ACCESS_TOKEN = 'f33e454a91091402a482b8821a9b36b3ab3ec6670ed4dc80072cb2d1af44e3e2'
const ENTRIES_PER_PAGE = 4

const cfClient = new CFClient(ENTRIES_PER_PAGE, CONTENTFUL_SPACE_ID, CONTENTFUL_ACCESS_TOKEN)

express()
    .set('view engine', 'dust')
    .set('views', __dirname + '/templates')
    .engine('dust', consolidate.dust)
    .use(express.static('static'))
    .get('/',           showList)
    .get('/page/:page', showList)
    .get('/post/:slug', (req, res, next) => {
        cfClient.getBlogDetail(req.params.slug)
            .then(result => {
                res.render('Detail', {entry: result})
            })
            .catch(error => next(error))
    })
    .use((error, req, res, next) => res.render('Error', {message: error.message + error.stack}))
    .listen(8888)

function showList(req, res, next) {
    let page = parseInt(req.params.page || 0, 10)

    cfClient.getListOverview(page)
        .then(result => {
            let data = result.length > 0 ? result : null

            res.render('List', {entries: data})
        })
        .catch(error => next(error))
}