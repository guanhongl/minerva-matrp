import { Meteor } from 'meteor/meteor';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { _ } from 'meteor/underscore';
import { MATRP } from '../matrp/MATRP';
import QRCode from 'qrcode';
import { Random } from 'meteor/random';
import { cloneDeep } from 'lodash';

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

export const dispenseMethod = new ValidatedMethod({
    name: 'vaccine.dispense',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ data }) {
        if (Meteor.isServer) {
            const collection = MATRP.vaccines;
            const history = MATRP.history;
            collection.assertValidRoleForMethod(this.userId);

            data.dispensedFrom = Meteor.user().username;
            // handle patient use dispense
            if (data.dispenseType === 'Patient Use') {
                data.quantity = '1';
            } else {
            // handle non patient use dispense
                data.dispensedTo = 'N/A';
                data.site = 'N/A';
                data.dose = '0';
            }
            // validation
            let errorMsg = '';
            // the required String fields
            const requiredFields = ['dispensedTo', 'site', 'vaccine', 'lotId', 'brand', 'visDate', 'dose', 'quantity'];
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
            data.dose = parseInt(data.dose, 10);
            data.quantity = parseInt(data.quantity, 10);

            const { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, 
                vaccine, lotId, brand, expire, dose, quantity, visDate, note } = data;
            const target = collection.findOne({ vaccine, brand }); // find the existing vaccine, brand pair
            const { _id, lotIds } = target;
            const copy = cloneDeep({ id: _id, lotIds }); // the copy of the record to update
            const targetIndex = lotIds.findIndex((o => o.lotId === lotId)); // find the index of existing the lotId
            const targetQuantity = lotIds[targetIndex].quantity;
            // if dispense quantity > target quantity:
            if (quantity > targetQuantity) {
                throw new Meteor.Error("quantity-cap", `${vaccine}, ${lotId} only has ${targetQuantity} dose(s) remaining.`);
            } else {
            // if dispense quantity < target quantity:
                if (quantity < targetQuantity) {
                    lotIds[targetIndex].quantity -= quantity; // decrement the quantity
                } else {
            // else if dispense quantity === target quantity:
                    lotIds.splice(targetIndex, 1); // remove the lotId b/c new quantity is 0
                }
            }

            // const update = { id: _id, lotIds };
            const element = [{ name: vaccine, lotId, brand, expire, dose, quantity, visDate }];
            const definitionData = { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site,
                note, element };
            
            try {
                collection.update(_id, { lotIds });
                history.define(definitionData);

                return `${vaccine}, ${lotId} updated successfully`;
            } catch (error) {
            // if update or define fail, restore the copy
                collection.update(_id, { lotIds: copy.lotIds });

                throw new Meteor.Error("update-error", error);
            };
        }
        return null;
    },
});

export const updateMethod = new ValidatedMethod({
    name: 'vaccine.update',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ _id, uuid, fields }) {
        if (Meteor.isServer) {
            const collection = MATRP.vaccines;
            collection.assertValidRoleForMethod(this.userId);
            const { newMinQuantity, newVisDate, newLotId, newExpire, newLocation, newQuantity, newNote } = fields;
            
            // validation
            const minQuantity = parseInt(newMinQuantity, 10);
            const quantity = parseInt(newQuantity, 10);
            // throw error if lot is empty
            if (!newLotId) {
                throw new Meteor.Error("empty-lot", "Lot cannot be empty.")
            }
            // throw error if lot is not unique
            const current = collection.findOne({ lotIds: { $elemMatch: { lotId: newLotId } } });
            const notUnique = !!current && (current.lotIds.find(o => o.lotId === newLotId)._id !== uuid);
            if (notUnique) {
                throw new Meteor.Error("unique-lot", "Lot must be unique.")
            }
            // submit
            const target = collection.findOne({ _id });
            const targetLot = target.lotIds.find(o => o._id === uuid);

            targetLot.lotId = newLotId;
            targetLot.expire = newExpire;
            targetLot.location = newLocation;
            targetLot.quantity = quantity;
            targetLot.note = newNote;
            const updateData = { minQuantity, visDate: newVisDate, lotIds: target.lotIds };
            collection.update(_id, updateData);

            return 'Vaccine updated successfully.';
        }
        return null;
    },
});