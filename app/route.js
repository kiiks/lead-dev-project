const formValidator = require('./form_validator');
const photoModel = require('./photo_model');
const { PubSub } = require('@google-cloud/pubsub');
const { Storage } = require('@google-cloud/storage');
const moment = require('moment')
require('dotenv').config()

async function publish(data, tags) {
  const projectId = process.env.GOOGLE_APPLICATION_CREDENTIALS.project_id;
  const topicNameOrId = 'dmi2-7';
  
  // Instantiates a client
  const pubsub = new PubSub({projectId});

  // Get topic
  const topic = await pubsub.topic(topicNameOrId);
  
  data.unshift({ tags: tags });
  // Send a message to the topic
  topic.publishMessage({ data: Buffer.from(JSON.stringify(data)) });
}

function route(app) {
  app.get('/', async (req, res) => {
    const tags = req.query.tags;
    const tagmode = req.query.tagmode;

    if (process.env.PHOTOS_ZIPPED === 'true') {
      const storage = new Storage();
      const options = {
        action: 'read',
        expires: moment().add(2, 'days').unix() * 1000
      };
      const signedUrls = await storage
        .bucket('dmii2022bucket')
        .file('public/users/photos_archive.zip')
        .getSignedUrl(options);
      res.redirect(signedUrls[0])
    }
    
    const ejsLocalVariables = {
      tagsParameter: tags || '',
      tagmodeParameter: tagmode || '',
      photos: [],
      searchResults: false,
      invalidParameters: false
    };

    // if no input params are passed in then render the view with out querying the api
    if (!tags && !tagmode) {
      return res.render('index', ejsLocalVariables);
    }

    // validate query parameters
    if (!formValidator.hasValidFlickrAPIParams(tags, tagmode)) {
      ejsLocalVariables.invalidParameters = true;
      return res.render('index', ejsLocalVariables);
    }

    // get photos from flickr public feed api
    return photoModel
      .getFlickrPhotos(tags, tagmode)
      .then(photos => {
        ejsLocalVariables.photos = photos;
        ejsLocalVariables.searchResults = true;
        return res.render('index', ejsLocalVariables);
      })
      .catch(error => {
        return res.status(500).send({ error });
      });
  });

  app.post('/zip', (req, res) => {
    const tags = req.query.tags;
    const tagmode = 'all';

    const ejsLocalVariables = {
      tagsParameter: tags || '',
      tagmodeParameter: tagmode || '',
      photos: [],
      searchResults: false,
      invalidParameters: false
    };

    // if no input params are passed in then render the view with out querying the api
    if (!tags && !tagmode) {
      return res.render('index', ejsLocalVariables);
    }

    // validate query parameters
    if (!formValidator.hasValidFlickrAPIParams(tags, tagmode)) {
      ejsLocalVariables.invalidParameters = true;
      return res.render('index', ejsLocalVariables);
    }

    // get photos from flickr public feed api
    return photoModel
      .getFlickrPhotos(tags, tagmode)
      .then(photos => {
        ejsLocalVariables.photos = photos;
        ejsLocalVariables.searchResults = true;
        publish(photos, tags);
        return res.render('index', ejsLocalVariables);
      })
      .catch(error => {
        return res.status(500).send({ error });
      })
  });
}

module.exports = route;
