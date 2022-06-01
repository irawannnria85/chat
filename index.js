let app = require('express')();
let fs = require('fs');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/short/:link/:exp/:inval', (req, res) => {
    let link = decodeURIComponent(req.params.link);
    let exp = req.params.exp;
    let inval = req.params.inval;
    let timemap = {
        '0': Date.now() + 24 * 60 * 60 * 1000,
        '1': Date.now() + 7 * 24 * 60 * 60 * 1000
    }
    if (!link.match(/^(https?\:\/\/)(\w+[.])+\w/)) res.send('Ungültiger Link');
    else fs.readFile(__dirname + '/data.json', (err, rawdata) => {
        if (err) throw err;
        let data = JSON.parse(rawdata);
        for (let id in data) {
            if (data[id].exp < Date.now()) delete data[id];
        }
        if (Object.keys(data).length >= 1000) {
            res.send('Server Overload');
            return;
        }
        let id;
        let map = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
        do {
            id = '';
            for (let i = 0; i < 5; i++) id += map[Math.floor(Math.random() * map.length)];
        } while (id in data);
        data[id] = {
            link: link,
            exp: timemap[exp],
            inval: inval == 'true'
        }
        res.send(id);
        fs.writeFile(__dirname + '/data.json', JSON.stringify(data), err => {
            if (err) throw err;
        });
    });
});

app.get('/:id', (req, res) => {
    let id = req.params.id;
    fs.readFile(__dirname + '/data.json', (err, rawdata) => {
        if (err) throw err;
        let data = JSON.parse(rawdata);
        if (id in data) res.sendFile(__dirname + '/info.html');
        else res.status(404).end();
    });
});

app.get('/info/:id', (req, res) => {
    let id = req.params.id;
    fs.readFile(__dirname + '/data.json', (err, rawdata) => {
        if (err) throw err;
        let data = JSON.parse(rawdata);
        if (id in data) {
            let link = data[id].link;
            let match = link.match(/^(https?\:\/\/)([\w.]+)/);
            if (match) res.send(match[2]);
            else res.send('Ungültiger Link');
        }
        else res.status(404).end();
    });
});

app.get('/open/:id', (req, res) => {
    let id = req.params.id;
    fs.readFile(__dirname + '/data.json', (err, rawdata) => {
        if (err) throw err;
        let data = JSON.parse(rawdata);
        if (id in data) {
            res.writeHead(301, { Location: data[id].link }); 
            res.end();
            if (data[id].inval) delete data[id];
            fs.writeFile(__dirname + '/data.json', JSON.stringify(data), err => {
                if (err) throw err;
            });
        }
        else res.status(404).end();
    });
});

app.get('*', (req, res) => {
    res.status(404).end();
})

module.exports = app;