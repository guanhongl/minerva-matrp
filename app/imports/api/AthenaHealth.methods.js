import { Meteor } from 'meteor/meteor';
import { fetch, Headers } from 'meteor/fetch';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

AUTH_TOKEN = ""
EXPIRES_IN = new Date()

/**
 * request a token using secret-based authentication
 * https://docs.athenahealth.com/api/guides/token-endpoint
 */
async function getAuthToken() {
    // get CLIENT_ID and CLIENT_SECRET
    const credentials = JSON.parse(Assets.getText("settings.production.json"))
    const { CLIENT_ID, CLIENT_SECRET } = credentials.ATHENAHEALTH

    // set up the POST body
    const body = {
        grant_type: "client_credentials",
        scope: "athena/service/Athenanet.MDP.*"
    }

    // fetch the access token
    const response = await fetch("https://api.preview.platform.athenahealth.com/oauth2/v1/token", {
        method: "POST",
        headers: new Headers({
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64")
        }),
        body: new URLSearchParams(body)
    })
    // json to object
    const response_object = await response.json()
    console.log(response_object)

    // throw error
    if (response_object.error) {
        throw new Error(`[${response_object.error}] ${response_object.detailedmessage}`)
    }

    AUTH_TOKEN = response_object.access_token
    console.log(AUTH_TOKEN)
    const d = new Date()
    EXPIRES_IN = new Date(d.getTime() + (response_object.expires_in * 1000))
    console.log(EXPIRES_IN)

    // resolve
    return Promise.resolve(true)
}

/**
 * Retrieves a list of medications configured in the system
 * https://docs.athenahealth.com/api/api-ref/order-prescription#Get-list-of-orderable-medication
 */
export const getListOfMedications = new ValidatedMethod({
    name: "getListOfMedications",
    mixins: [CallPromiseMixin],
    validate: null,
    async run({ searchvalue }) {
        if (!this.userId) {
            throw new Meteor.Error('unauthorized', 'You must be logged in.')
        }

        if (Meteor.isServer) {
            const practiceid = "195900" // tmp

            // refresh the access token if expired
            if (new Date() > EXPIRES_IN) {
                try {
                    const wait = await getAuthToken()
                } catch (e) {
                    throw new Meteor.Error(e.message)
                }
            }

            // generate GET URL
            const URL = `https://api.preview.platform.athenahealth.com/v1/${practiceid}/reference/order/prescription?` + new URLSearchParams({
                searchvalue
            })

            // fetch list of medications
            const response = await fetch(URL, {
                method: "GET",
                headers: new Headers({
                    "Accept": "application/json",
                    "Authorization": `Bearer ${AUTH_TOKEN}`
                })
            })
            // json to object
            const response_object = await response.json()
            console.log(response_object)

            // throw error
            if (response_object.error) {
                throw new Meteor.Error(response_object.error, response_object.detailedmessage)
            }

            // resolve
            return Promise.resolve(response_object)
        }
    }
})

/**
 * Retrieves a list of orderable vaccines
 * https://docs.athenahealth.com/api/api-ref/order-vaccine#Get-list-of-orderable-vaccines
 */
export const getListOfVaccines = new ValidatedMethod({
    name: "getListOfVaccines",
    mixins: [CallPromiseMixin],
    validate: null,
    async run({ searchvalue }) {
        if (!this.userId) {
            throw new Meteor.Error('unauthorized', 'You must be logged in.')
        }

        if (Meteor.isServer) {
            const practiceid = "195900" // tmp

            // refresh the access token if expired
            if (new Date() > EXPIRES_IN) {
                try {
                    const wait = await getAuthToken()
                } catch (e) {
                    throw new Meteor.Error(e.message)
                }
            }

            // generate GET URL
            const URL = `https://api.preview.platform.athenahealth.com/v1/${practiceid}/reference/order/vaccine?` + new URLSearchParams({
                searchvalue
            })

            // fetch list of vaccines
            const response = await fetch(URL, {
                method: "GET",
                headers: new Headers({
                    "Accept": "application/json",
                    "Authorization": `Bearer ${AUTH_TOKEN}`
                })
            })
            // json to object
            const response_object = await response.json()
            console.log(response_object)

            // throw error
            if (response_object.error) {
                throw new Meteor.Error(response_object.error, response_object.detailedmessage)
            }

            // resolve
            return Promise.resolve(response_object)
        }
    }
})

/**
 * Retrieves a list of dosage units configured in the system
 * https://docs.athenahealth.com/api/api-ref/order-prescription#Get-list-of-units-for-dosage-quantities
 */
export const getListOfUnits = new ValidatedMethod({
    name: "getListOfUnits",
    mixins: [CallPromiseMixin],
    validate: null,
    async run() {
        if (!this.userId) {
            throw new Meteor.Error('unauthorized', 'You must be logged in.')
        }

        if (Meteor.isServer) {
            const practiceid = "195900" // tmp

            // refresh the access token if expired
            if (new Date() > EXPIRES_IN) {
                try {
                    const wait = await getAuthToken()
                } catch (e) {
                    throw new Meteor.Error(e.message)
                }
            }

            // generate GET URL
            const URL = `https://api.preview.platform.athenahealth.com/v1/${practiceid}/reference/order/prescription/dosagequantityunits`

            // fetch list of units
            const response = await fetch(URL, {
                method: "GET",
                headers: new Headers({
                    "Accept": "application/json",
                    "Authorization": `Bearer ${AUTH_TOKEN}`
                })
            })
            // json to object
            const response_object = await response.json()
            console.log(response_object)

            // throw error
            if (response_object.error) {
                throw new Meteor.Error(response_object.error, response_object.detailedmessage)
            }

            // resolve
            return Promise.resolve(response_object)
        }
    }
})
