'use strict';

function main(app) {
  const subscriptionNameOrId = 'dmi2-7'
  const timeout = Number(60);

  const { PubSub } = require('@google-cloud/pubsub');
  const { Storage } = require('@google-cloud/storage');
  const ZipStream = require('zip-stream');
  const request =  require('request');
  const { loadInDB } = require('./firebase-admin');
  require('dotenv').config()

  const pubSubClient = new PubSub();
  
  let currentZipFileName = null;

  function listenForMessages() {
    const subscription = pubSubClient.subscription(subscriptionNameOrId);

    let messageCount = 0;
    const messageHandler = async message => {
        const data = JSON.parse(message.data);
        // Format is not good
        if (!data[0]) return;

        currentZipFileName = data[0].tags;
        
        const medias = [];
        for(let i = 1; i < 11; i++) {
            if (data[i] == null) return;
            medias.push({ name: 'photo' + i + '.jpg', url: data[i].media.m });
        }

        const zip = ZipStream();
        const storage = new Storage();
        const file = await storage
            .bucket('dmii2022bucket')
            .file('public/users/' + currentZipFileName + '.zip');
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

                let zipFile = null;
                storage.bucket('dmii2022bucket').file('public/users/' + currentZipFileName + '.zip').createReadStream()
                .on('data', (file) => {
                    zipFile = file;
                }).on('end', () => {
                    loadInDB(zipFile, new Date(Date.now()).getHours(), currentZipFileName);
                    currentZipFileName = null;
                });

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