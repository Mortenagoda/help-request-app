const functions = require('firebase-functions');

const uuidv4 = require('uuid/v4');
const emailValidator = require('email-validator');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

let db = admin.firestore();

exports.addHelpRequest = functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
        let helpRequest = mapHelpRequestAttributes(req.body);

        var validationErrorSid = validateHelpRequest(helpRequest);
        if (validationErrorSid) {
            res.status(400).send(toError(validationErrorSid));
        } else {
            persistHelpRequest(helpRequest, req, res);
        }
    } else {
        res.status(400).send(toError('unsupported-method'));
    }
});

function persistHelpRequest(helpRequest, req, res) {
    var docId = uuidv4();
    let document = db.collection('helpRequests').doc(docId);
    document.set(helpRequest).then(writeRes => {
        let href = req.baseUrl + '/help-requests/' + docId;
        res.status(201).header('Location', href).send({
            'href': href
        });
        return;
    }).catch(rejectedRes => {
        console.log('Error persisting help request.', rejectedRes);
        res.status(500).send(toError('internal-error'));
        return;
    });
}

function toError(validate) {
    return {
        'error-sid': validate
    };
}

function mapHelpRequestAttributes(body) {
    return (({ contactEmail, message }) => ({ contactEmail, message }))(body);
}

function validateHelpRequest(req) {
    if (!req.contactEmail || !emailValidator.validate(req.contactEmail.trim())) {
        return 'invalid-email';
    }
    req.contactEmail = req.contactEmail.trim();

    if (!req.message && req.message.trim()) {
        return 'empty-message';
    }
    req.message = req.message.trim();

    return undefined;
}
