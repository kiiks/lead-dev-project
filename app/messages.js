'use strict';

function main(app) {
  const subscriptionNameOrId = 'dmi2-7'
  const timeout = Number(60);

  const { PubSub } = require('@google-cloud/pubsub');
  const { Storage } = require('@google-cloud/storage');
  const ZipStream = require('zip-stream');
  const request =  require('request');
  require('dotenv').config()

  // Creates a client; cache this for further use
  const pubSubClient = new PubSub();

  function listenForMessages() {
    const subscription = pubSubClient.subscription(subscriptionNameOrId);

    // Create an event handler to handle messages
    let messageCount = 0;
    const messageHandler = async message => {
        const data = JSON.parse(message.data);
        const medias = [];
        for(let i = 0; i < 10; i++) {
            medias.push({ name: 'photo' + i + '.jpg', url: data[i].media.m });
        }

        const zip = ZipStream();
        const storage = new Storage();
        const file = await storage
            .bucket('dmii2022bucket')
            .file('public/users/photos_archive.zip');

        const stream = file.createWriteStream({
            metadata: {
                contentType: 'application/zip',
                cacheControl: 'private'
            },
            resumable: false
        });

        zip.pipe(stream);

        function addNextFile() {
            var elem = medias.shift()
            var stream = request(elem.url)
            zip.entry(stream, { name: elem.name }, err => {
                if(err)
                    throw err;
                if(medias.length > 0)
                    addNextFile()
                else
                    zip.finalize()
            })
        }
        addNextFile();
        
        messageCount += 1;
        message.ack();

        return new Promise ((resolve, reject) => {
            stream.on('error', (err) => {
                reject(err);
            });
            stream.on('finish', () => {
                console.log('successfully zipped photos !')
                process.env.PHOTOS_ZIPPED = true
                app.get('/');
                resolve('Ok');
            });
        });
    };

    subscription.on('message', messageHandler);

    setTimeout(() => {
      subscription.removeListener('message', messageHandler);
      console.log(`${messageCount} message(s) received.`);
    }, timeout * 1000);
  }

  listenForMessages();
}

module.exports = main;