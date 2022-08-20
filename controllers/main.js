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
    const contract = req.app.locals.contract;
    const prettyJSONString = req.app.locals.prettyJSONString;
    const { id, organization, docyType, docName, studentName, issueDate, imgHash } = req.body;

    try {
        const result = await contract.submitTransaction('IssueDocument', id, organization, docyType, docName, studentName, issueDate, imgHash);
        if (`${result}` !== '') 
            res.send(prettyJSONString(result.toString()));
    } catch (error) {
        res.send({error: error.message});
    }
}

exports.putDocument = async (req, res) => { 
    const contract = req.app.locals.contract;
    const { id, organization, docyType, docName, studentName, issueDate, imgHash } = req.body;

    try {       
        await contract.submitTransaction('UpdateDocument', id, organization, docyType, docName, studentName, issueDate, imgHash);
		res.send({message: "Document Updated!"})
    } catch (error) {
        res.send({error: error.message});
    }
}