import { Meteor } from 'meteor/meteor';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { _ } from 'meteor/underscore';
import { MATRP } from '../matrp/MATRP';
import QRCode from 'qrcode';
import { Random } from 'meteor/random';

export const addMethod = new ValidatedMethod({
    name: 'supply.add',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ data }) {
        if (Meteor.isServer) {
            const collection = MATRP.supplies;
            collection.assertValidRoleForMethod(this.userId);

            // validation
            let errorMsg = '';
            // the required String fields
            const requiredFields = ['supply', 'supplyType', 'minQuantity', 'location', 'quantity'];
            // if the field is empty, append error message
            requiredFields.forEach(field => {
                if (!data[field]) {
                    errorMsg += `${field} cannot be empty.\n`;
                }
            });
            if (errorMsg) {
                throw new Meteor.Error("required-fields", errorMsg);
            }

            // submit
            data.minQuantity = parseInt(data.minQuantity, 10);
            data.quantity = parseInt(data.quantity, 10);

            const { supply, supplyType, minQuantity, quantity, location, donated, donatedBy, note } = data;
            const target = collection.findOne({ supply }); // returns the existing supply or undefined
            const targetLot = target?.stock?.find(o => ( o.location === location && o.donated === donated )); // returns the existing lot or undefined
            // if lot exists, increment the quantity:
            if (!!targetLot) {
                targetLot.quantity += quantity;
                collection.update(target._id, { stock: target.stock });

                return targetLot.QRCode;
            } else {
                // generate the QRCode and the uuid for the new lot
                const _id = Random.id();
                const URL = Meteor.absoluteUrl(`/#/dispense?tab=2&_id=${_id}`);
                
                return QRCode.toDataURL(URL)
                    .then(url => {
                        const newLot = { _id, quantity, location, donated, donatedBy, note, QRCode: url };
                        // if the supply does not exist:
                        if (!!!target) {
                            // insert the new supply and lot
                            const definitionData = { supply, supplyType, minQuantity, stock: [newLot] };
                            collection.define(definitionData);

                            return url;
                        } else {
                            // else append the new lot
                            target.stock.push(newLot);
                            collection.update(target._id, { stock: target.stock });

                            return url;
                        }
                    })
                    .catch(err => {
                        throw new Meteor.Error("qrcode-failure", err);
                    });
            }
        }
        return null;
    },
});