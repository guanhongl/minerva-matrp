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
    run({ fields, innerFields }) {
        if (Meteor.isServer) {
            const collection = MATRP.vaccines;
            const history = MATRP.history;
            collection.assertValidRoleForMethod(this.userId);

            fields.dispensedFrom = Meteor.user().username;
            // handle patient use dispense
            if (fields.dispenseType === 'Patient Use') {
                // fields.quantity = '1';
                innerFields.forEach(o => o.quantity = '1');
            } else {
            // handle non patient use dispense
                fields.dispensedTo = 'N/A';
                fields.site = 'N/A';
                // fields.dose = '0';
                innerFields.forEach(o => o.dose = '0');
            }
            // validation
            let errorMsg = '';
            // the required String fields
            const requiredFields = ['dispensedTo', 'site'];
            const requiredInnerFields = ['vaccine', 'lotId', 'brand', 'visDate', 'dose', 'quantity'];
            // if the field is empty, append error message
            requiredFields.forEach(field => {
                if (!fields[field]) {
                    errorMsg += `${field} cannot be empty.\n`;
                }
            });
            requiredInnerFields.forEach(field => {
                if (innerFields.some(o => o[field] === '')) {
                    errorMsg += `${field} cannot be empty.\n`;
                }
            });
            if (errorMsg) {
                throw new Meteor.Error("required-fields", errorMsg);
            }

            // submit
            // data.dose = parseInt(data.dose, 10);
            // data.quantity = parseInt(data.quantity, 10);
            innerFields.forEach(o => {
                o.dose = parseInt(o.dose, 10);
                o.quantity = parseInt(o.quantity, 10);
            });

            // const { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, 
            //     vaccine, lotId, brand, expire, dose, quantity, visDate, note } = data;
            const { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, note } = fields;
            const copy = []; // the copy of records to update
            const update = []; // the records to update
            const element = []; // the historical record elements
            let successMsg = '';

            innerFields.forEach(field => {
                const { vaccine, lotId, brand, expire, dose, quantity, visDate } = field;
                const target = collection.findOne({ vaccine, brand }); // find the existing vaccine, brand pair
                const { _id } = target;
                const match = update.find(o => o._id === _id);
                const lotIds = !!match ? match.lotIds : target.lotIds; // set reference to match or target
                if (!!!match) { 
                    copy.push(cloneDeep( { _id, lotIds } )); // store a copy (we modify lotIds)
                }
                const targetIndex = lotIds.findIndex((o => o.lotId === lotId)); // find the index of the existing lotId
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
                if (!!!match) {
                    update.push({ _id, lotIds }); // store the update
                }
                element.push({ name: vaccine, lotId, brand, expire, dose, quantity, visDate });
                successMsg += `${vaccine}, ${lotId} updated successfully.\n`;
            });

            const definitionData = { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site,
                note, element };
            
            try {
                // collection.update(_id, { lotIds });
                collection.updateMany(update);
                history.define(definitionData);

                return successMsg;
            } catch (error) {
            // if update or define fail, restore the copy
                // collection.update(_id, { lotIds: copy.lotIds });
                collection.updateMany(copy);

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
            // collection.assertValidRoleForMethod(this.userId);
            collection.assertValidRoleForUpdate(this.userId);
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

export const brandFilterMethod = new ValidatedMethod({
    name: 'vaccine.brandFilter',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ brand }) {
        if (Meteor.isServer) {
            const collection = MATRP.vaccines;
            collection.assertValidRoleForMethod(this.userId);
            return _.pluck(
                collection.find({ brand }, { sort: { vaccine: 1 }, fields: { vaccine: 1 } }).fetch(),
                "vaccine",
            );
        }
        return null;
    },
});