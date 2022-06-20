import { Meteor } from 'meteor/meteor';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { _ } from 'meteor/underscore';
import { MATRP } from '../matrp/MATRP';
import QRCode from 'qrcode';
import { Random } from 'meteor/random';

export const brandFilterMethod = new ValidatedMethod({
    name: 'drug.brandFilter',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ brand }) {
        if (Meteor.isServer) {
            const collection = MATRP.drugs;
            collection.assertValidRoleForMethod(this.userId);
            return _.pluck(
                collection.find({ lotIds: { $elemMatch: { brand } } }, { sort: { drug: 1 }, fields: { drug: 1 } }).fetch(),
                "drug",
            );
        }
        return null;
    },
});

export const addMethod = new ValidatedMethod({
    name: 'drug.add',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ data }) {
        if (Meteor.isServer) {
            const collection = MATRP.drugs;
            collection.assertValidRoleForMethod(this.userId);

            // validation
            let errorMsg = '';
            // the required String fields
            const requiredFields = ['drug', 'drugType', 'minQuantity', 'lotId', 'brand', 'location', 'quantity'];
            // if the field is empty, append error message
            requiredFields.forEach(field => {
                if (!data[field] || (field === 'drugType' && !data.drugType.length)) {
                    errorMsg += `${field} cannot be empty.\n`;
                }
            });
            if (errorMsg) {
                throw new Meteor.Error("required-fields", errorMsg);
            }

            // submit
            data.minQuantity = parseInt(data.minQuantity, 10);
            data.quantity = parseInt(data.quantity, 10);

            const { drug, drugType, minQuantity, quantity, unit, brand, lotId, expire, location, donated, donatedBy, note } = data;
            const target = collection.findOne({ drug }); // returns the existing drug or undefined
            const targetLot = target?.lotIds?.find(o => o.lotId === lotId); // returns the existing lot or undefined
            // if lot exists, increment the quantity:
            if (!!targetLot) {
                targetLot.quantity += quantity;
                collection.update(target._id, { lotIds: target.lotIds });

                return targetLot.QRCode;
            } else {
                // generate the QRCode and the uuid for the new lot
                const _id = Random.id();
                const URL = Meteor.absoluteUrl(`/#/dispense?tab=0&_id=${_id}`);
                
                return QRCode.toDataURL(URL)
                    .then(url => {
                        const newLot = { _id, lotId, brand, expire, location, quantity, donated, donatedBy, note, QRCode: url };
                        // if the drug does not exist:
                        if (!!!target) {
                            // insert the new drug and lot
                            const definitionData = { drug, drugType, minQuantity, unit, lotIds: [newLot] };
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