const generateQRCode = async (docId) => { 
    const QRCode = require('qrcode');
    const path = require('path');

    const opts = {
        errorCorrectionLevel: 'H',
        type: 'png',
        quality: 0.95,
        margin: 1,
        color: {
            dark: '#208698',
            light: '#FFF',
        },
    }
    
    const resultPath = path.join(__dirname, "..", "res", "qrcodes", `qrcode${docId}.png`);
    await QRCode.toFile(resultPath, JSON.stringify(`http://localhost:3000/verifyQR/${docId}`), opts);

    return resultPath;
}

const attachQRCodeToPdf = async (id, pathToPDF, pathToImage) => { 
    const { PDFDocument } = require('pdf-lib');
    const path = require('path');
    const fs = require('fs');

    const pdfDoc = await PDFDocument.load(fs.readFileSync(pathToPDF));
    const img = await pdfDoc.embedPng(fs.readFileSync(pathToImage));
    const imagePage = pdfDoc.getPage(0);
        
    imagePage.drawImage(img, {
        x: 30,
        y: 30,
        width: 100,
        height: 100
    });

    const pdfBytes = await pdfDoc.save();
    const newFilePath = path.join(__dirname, '..', 'res', 'result-pdf', `${id}.pdf`);
    fs.writeFileSync(newFilePath, pdfBytes);
}

exports.test = async (req, res) => { 
    res.send({"message": `App is Working! Localhost running on port ${req.app.locals.PORT}`})
}

exports.off = async (req, res) => { 
    req.app.locals.gateway.disconnect();
    res.send({"message": "App is Disconnected from Hypreledger."})
}

exports.getDocuments = async (req, res) => { 
    const contract = req.app.locals.contract;
    const prettyJSONString = req.app.locals.prettyJSONString;

    try {
        const result = await contract.evaluateTransaction('GetAllDocuments');
        res.send(prettyJSONString(result.toString()));
    } catch (error) {
        res.send({error: error.message});
    }
}

exports.getDocument = async (req, res) => { 
    const contract = req.app.locals.contract;
    const prettyJSONString = req.app.locals.prettyJSONString;
    const documentID = req.params.id;

    try {
        const result = await contract.evaluateTransaction('ReadDocument', documentID);
        res.send(prettyJSONString(result.toString()));
    } catch (error) {
        res.send({error: error.message});
    }
}

exports.postDocument = async (req, res) => {
    const pdfToBase64 = require('pdf-to-base64');
    const crypto = require('crypto');
    const contract = req.app.locals.contract;
    const prettyJSONString = req.app.locals.prettyJSONString;
    const { id, organization, docyType, docName, studentName, issueDate, grade } = req.body;
    const path = require('path');

    
    try {

        const file = req.files.file;
        const filePath = path.join(__dirname, "..", "res", "result-pdf", `${id}.pdf`);

        await file.mv(filePath);
        const resultPath = await generateQRCode(id);
        await attachQRCodeToPdf(id, filePath, resultPath);
        const b64pdf = await pdfToBase64(filePath);
        const pdfHash = crypto.createHash('sha256').update(b64pdf).digest('hex');

        const result = await contract.submitTransaction('IssueDocument', id, organization, docyType, docName, studentName, grade, issueDate, pdfHash, process.env.ORG_MSP);
        if (`${result}` !== '') 
            res.send(prettyJSONString(result.toString()));
    } catch (error) {
        res.send({error: error.message});
    }
}

exports.putDocument = async (req, res) => { 
    const pdfToBase64 = require('pdf-to-base64');
    const crypto = require('crypto');
    const contract = req.app.locals.contract;
    const prettyJSONString = req.app.locals.prettyJSONString;
    const { id, organization, docyType, docName, studentName, grade, issueDate } = req.body;
    let {imgHash} = req.body;

    const path = require('path');
    
    try {
        
        if(req.files != null) {
            const file = req.files.file;
            const filePath = path.join(__dirname, "..", "res", "result-pdf", `${id}.pdf`);
    
            await file.mv(filePath);
            const resultPath = await generateQRCode(id);
            await attachQRCodeToPdf(id, filePath, resultPath);
            const b64pdf = await pdfToBase64(filePath);
            imgHash = crypto.createHash('sha256').update(b64pdf).digest('hex');
         }

        await contract.submitTransaction('UpdateDocument', id, organization, docyType, docName, studentName, grade, issueDate, imgHash, process.env.ORG_MSP.toString());
		res.send({message: "Document Updated!"})
    } catch (error) {
        res.send({error: error.message});
    }
}

exports.getDocHistory = async (req, res) => { 
    const contract = req.app.locals.contract;
    const prettyJSONString = req.app.locals.prettyJSONString;
    const documentID = req.params.id;

    try {
        const result = await contract.evaluateTransaction('GetDocumentHistory', documentID);
        res.send(prettyJSONString(result.toString()));
    } catch (error) {
        res.send({error: error.message});
    }
}

exports.verDocQR = async (req, res) => { 
    const contract = req.app.locals.contract;
    const prettyJSONString = req.app.locals.prettyJSONString;
    
    const documentID = req.body.docID;

    try {

        const result = await contract.evaluateTransaction('ReadDocument', documentID);
        if (result.error) { 
            return res.send({isValid: false})
        }
        
        const history = await contract.evaluateTransaction('GetDocumentHistory', documentID);


        //:::> Return History of edition
        res.send({isValid: true, history: JSON.parse(prettyJSONString(history.toString()))});
    } catch (error) {
        res.send({isValid: false, history: [], error: error.message});
    }
}

exports.verifyFile = async (req, res) => { 
    try {
        const {fromPath} = require('pdf2pic');
        const { PNG } = require('pngjs');
        const jsQR = require('jsqr');
        const path = require('path');
        const pdfToBase64 = require('pdf-to-base64');
        const crypto = require('crypto');
        const contract = req.app.locals.contract;

        const file = req.files.file;
        const pathToFile = path.join(__dirname, "..", "res", "temp", file.name);
        await file.mv(pathToFile);
        const b64pdf = await pdfToBase64(pathToFile);
        imgHash = crypto.createHash('sha256').update(b64pdf).digest('hex');

        const pdf2picOptions = {
            quality: 100,
            density: 300,
            format: 'png',
        };
        

        let dataUri = await fromPath(pathToFile, pdf2picOptions)(1, true);
        dataUri = dataUri.base64;
        const buffer = Buffer.from(dataUri, 'base64');
        const png = PNG.sync.read(buffer);
    
        const code = jsQR(Uint8ClampedArray.from(png.data), png.width, png.height);
        const qrcodeText = code.data; 
        let id  = qrcodeText.split("/")[4]
        id = id.replace('"', '')
        
        let result = await contract.evaluateTransaction('ReadDocument', id);
        result = JSON.parse(result.toString());

        if(result.imgHash == imgHash) { 
            const history = await contract.evaluateTransaction('GetDocumentHistory', id);
            res.send({message: "Verification Successful", isValid: true, history: JSON.parse(history)});
        } else {
            throw new Error("Verification Failure"); 
        }
        
    } catch (error) {
        res.send({message: "Verification Failure", isValid: false, history: [], error: error.message});
    }
}

exports.getCertDocument = async (req, res) => { 
    try {
        const path = require('path');
        const docId = req.params.id;
        const filePath = path.join(__dirname, "..", "res", "result-pdf", `${docId}.pdf`);
        res.download(filePath)
    } catch (error) {
        res.send({error: error.message});
    }
}