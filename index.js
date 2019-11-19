const BPA = "./BPA";
let fs = require("fs");
const Path = require("path");
const express = require("express");
const app = express();
var multer = require("multer");
var cors = require("cors");

var bodyParser = require("body-parser");

//Config
app.use(bodyParser.json());
app.use(cors());

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "BPA/");
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

var upload = multer({ storage: storage }).single("file");
//----------------------------------------------------------

//Crear el proceso con el nompbre del proceso
createProcess = path => {
  storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, `${BPA}/${path}`);
    },
    filename: function(req, file, cb) {
      cb(null, file.originalname);
    }
  });

  upload = multer({ storage: storage }).single("file");

  if (!fs.existsSync(`${BPA}/${path}`)) {
    fs.mkdirSync(`${BPA}/${path}`);
  }
};

//Borra el proceso con el nompbre del proceso
deleteProcess = path => {
  if (fs.existsSync(`${BPA}/${path}`)) {
    fs.readdirSync(`${BPA}/${path}`).forEach((file, index) => {
      const curPath = Path.join(`${BPA}/${path}`, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(`${BPA}/${path}`);
  }
};

//lee el directorio completo dado un path y un objeto
readDirectory = (path, dir) => {
  if (fs.existsSync(`${path}`)) {
    let files = fs.readdirSync(`${path}`);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const curPath = Path.join(`${path}`, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        let d = {
          dir: Path.join(`${path}`, file),
          data: [],
          dirs: []
        };
        dir.dirs.push(d);
        readDirectory(curPath, d);
      } else {
        if (dir.data === undefined) {
          dir.data = [];
          dir.data.push(file);
        } else {
          dir.data.push(file);
        }
      }
    }
  }
};

//lee la BPA
readBPA = path => {
  let directory = {
    dir: BPA,
    data: [],
    dirs: []
  };

  readDirectory(BPA, directory);

  return directory;
};

//----------------------------------------------------------

//Services

app.post("/uploadXml/:url", function(req, res) {
  createProcess(req.params.url);
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).send(req.file);
  });
});

app.post("/uploadJson/:url", function(req, res, next) {
  let str = JSON.stringify(req.body);
  fs.writeFileSync(`${BPA}/${req.params.url}/Diagram.json`, str);
  return res.status(200).send("ok");
});

app.get("/getDiagram/:url", function(req, res, next) {
  let param = req.params.url;
  return res.status(200).send("ok");
});

app.get("/getBpa", function(req, res, next) {
  return res.status(200).send(readBPA());
});

//----------------------------------------------------------

//RUN
if (!fs.existsSync(BPA)) {
  fs.mkdirSync(BPA);
}

// let x = readBPA(BPA);

// console.log(util.inspect(x, false, null, true /* enable colors */));

app.listen(8001, function() {
  console.log("App running on port 8001");
});
