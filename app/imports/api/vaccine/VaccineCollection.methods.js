import { Meteor } from 'meteor/meteor';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { _ } from 'meteor/underscore';
import { MATRP } from '../matrp/MATRP';
import QRCode from 'qrcode';
import { Random } from 'meteor/random';

export const addMethod = new ValidatedMethod({
    name: 'vaccine.add',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ data }) {
        if (Meteor.isServer) {
            const collection = MATRP.vaccines;
            collection.assertValidRoleForMethod(this.userId);

            // validation
            let errorMsg = '';
            // the required String fields
            const requiredFields = ['vaccine', 'brand', 'minQuantity', 'visDate', 'lotId', 'location', 'quantity'];
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

            const { vaccine, brand, minQuantity, visDate, lotId, expire, location, quantity, note } = data;
            const target = collection.findOne({ vaccine, brand }); // returns the existing vaccine, brand pair or undefined
            const targetLot = target?.lotIds?.find(o => o.lotId === lotId); // returns the existing lot or undefined
            // if lot exists, increment the quantity:
            if (!!targetLot) {
                targetLot.quantity += quantity;
                collection.update(target._id, { lotIds: target.lotIds });

                return targetLot.QRCode;
            } else {
                // generate the QRCode and the uuid for the new lot
                const _id = Random.id();
                const URL = Meteor.absoluteUrl(`/#/dispense?tab=1&_id=${_id}`);
                
                return QRCode.toDataURL(URL)
                    .then(url => {
                        const newLot = { _id, lotId, expire, location, quantity, note, QRCode: url };
                        // if the vaccine, brand pair does not exist:
                        if (!!!target) {
                            // insert the new vaccine, brand pair and lot
                            const definitionData = { vaccine, brand, minQuantity, visDate, lotIds: [newLot] };
                            collection.define(definitionData);

                            return url;
                        } else {
                            // else append the new lot
                            target.lotIds.push(newLot);
                            collection.update(target._id, { lotIds: target.lotIds });

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