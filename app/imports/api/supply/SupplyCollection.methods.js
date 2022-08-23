import { Meteor } from 'meteor/meteor';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { _ } from 'meteor/underscore';
import { MATRP } from '../matrp/MATRP';
import QRCode from 'qrcode';
import { Random } from 'meteor/random';
import { cloneDeep } from 'lodash';

export const addMethod = new ValidatedMethod({
    name: 'supply.add',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ data }) {
        if (Meteor.isServer) {
            const collection = MATRP.supplies;
            collection.assertValidRoleForMethod(this.userId);

            // set quantities to -1 if isDiscrete is false
            if (!data.isDiscrete) {
                data.minQuantity = "-1"
                data.quantity = "-1"
            }
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

            const { supply, supplyType, minQuantity, quantity, location, donated, donatedBy, note, isDiscrete } = data;
            const target = collection.findOne({ supply }); // returns the existing supply or undefined
            const targetLot = target?.stock?.find(o => o.donated === donated); // returns the existing lot or undefined
            // if lot exists, increment the quantity:
            if (!!targetLot) {
                if (!data.isDiscrete) {
                    // the location will not update here...

                    throw new Meteor.Error("supply-exists", "The supply already exists.")
                }

                targetLot.quantity += quantity;
                targetLot.location = location;
                collection.update(target._id, { stock: target.stock });

                return targetLot.QRCode;
            } else {
                // generate the QRCode and the uuid for the new lot
                const _id = Random.id();
                const URL = Meteor.absoluteUrl(`/#/dispense/supply?_id=${_id}`);
                
                return QRCode.toDataURL(URL)
                    .then(url => {
                        const newLot = { _id, quantity, location, donated, donatedBy, note, QRCode: url };
                        // if the supply does not exist:
                        if (!!!target) {
                            // insert the new supply and lot
                            const definitionData = { supply, supplyType, minQuantity, isDiscrete, stock: [newLot] };
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

export const dispenseMethod = new ValidatedMethod({
    name: 'supply.dispense',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ fields, innerFields }) {
        if (Meteor.isServer) {
            const collection = MATRP.supplies;
            const history = MATRP.history;
            collection.assertValidRoleForMethod(this.userId);

            fields.dispensedFrom = Meteor.user().username;
            // handle non patient use dispense
            if (fields.dispenseType !== 'Patient Use') {
                fields.dispensedTo = 'N/A';
                fields.site = 'N/A';
            }
            // set quantity(s) to -1 if isDiscrete is false
            innerFields.forEach(o => {
                if (!o.isDiscrete) {
                    o.quantity = "-1"
                }
            })
            // validation
            let errorMsg = '';
            // the required String fields
            const requiredFields = ['dispensedTo', 'site'];
            const requiredInnerFields = ['supply', 'supplyType', 'quantity'];
            // if the field is empty, append error message
            requiredFields.forEach(field => {
                if (!fields[field]) {
                    errorMsg += `${field} cannot be empty.\n`;
                }
            });
            requiredInnerFields.forEach(field => {
                if (innerFields.some(o => o[field] === '')) { // if any required inner fields are empty
                    errorMsg += `${field} cannot be empty.\n`;
                }
            });
            if (errorMsg) {
                throw new Meteor.Error("required-fields", errorMsg);
            }

            // submit
            innerFields.forEach(o => {
                o.quantity = parseInt(o.quantity, 10);
            });

            const { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, note } = fields;
            const copy = []; // the copy of records to update
            const update = []; // the records to update
            const element = []; // the historical record elements
            let successMsg = '';

            innerFields.forEach(field => {
                const { supply, supplyType, isDiscrete, quantity, donated, donatedBy } = field;

                if (isDiscrete) {

                    const target = collection.findOne({ supply }); // find the existing supply
                    const { _id } = target;
                    const match = update.find(o => o._id === _id);
                    const stock = !!match ? match.stock : target.stock; // set reference to match or target
                    if (!!!match) { 
                        copy.push(cloneDeep( { _id, stock } )); // store a copy (we modify stock)
                    }
                    const targetIndex = stock.findIndex(o => o.donated === donated); // find the index of the existing supply

                    if (targetIndex == -1) {
                        throw new Meteor.Error("not-found", `${supply} ${donated ? "(donated) ": ""}not found.`);
                    }

                    const targetQuantity = stock[targetIndex].quantity;
                    // if dispense quantity > target quantity:
                    if (quantity > targetQuantity) {
                        throw new Meteor.Error("quantity-cap", `${supply} only has ${targetQuantity} remaining.`);
                    } else {
                    // if dispense quantity < supply quantity:
                        if (quantity < targetQuantity) {
                            stock[targetIndex].quantity -= quantity; // decrement the quantity
                        } else {
                    // else if dispense quantity === supply quantity:
                            stock.splice(targetIndex, 1); // remove the stock
                        }
                    }
                    if (!!!match) {
                        update.push({ _id, stock }); // store the update
                    }

                }
                // if non discrete, simply insert the historical record

                element.push({ name: supply, supplyType, quantity, donated, donatedBy });
                successMsg += `${supply} updated successfully.\n`;
            });

            const definitionData = { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, note, element };

            try {
                // collection.update(_id, { stock });
                collection.updateMany(update);
                history.define(definitionData);

                return successMsg;
            } catch (error) {
            // if update or define fail, restore the copy
                // collection.update(_id, { stock: copy.stock });
                collection.updateMany(copy);

                throw new Meteor.Error("update-error", error.message);
            };
        }
        return null;
    },
});

export const updateMethod = new ValidatedMethod({
    name: 'supply.update',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ _id, uuid, fields }) {
        if (Meteor.isServer) {
            const collection = MATRP.supplies;
            // collection.assertValidRoleForMethod(this.userId);
            collection.assertValidRoleForUpdate(this.userId);
            const { newSupplyType, newMinQuantity, newIsDiscrete, newLocation, newQuantity, newDonated, newDonatedBy, newNote } = fields;
            
            // validation
            const minQuantity = newIsDiscrete ? parseInt(newMinQuantity, 10) : -1;
            const quantity = newIsDiscrete ? parseInt(newQuantity, 10) : -1;
            // throw error if (location, donated) is not unique
            const target = collection.findOne({ _id });
            const current = target.stock.find(o => ( o.location === newLocation && o.donated === newDonated ));
            const notUnique = !!current && (current._id !== uuid);
            if (notUnique) {
                throw new Meteor.Error("unique-error", "Location, donated pair must be unique.")
            }
            // submit
            const targetLot = target.stock.find(o => o._id === uuid);
            targetLot.location = newLocation;
            targetLot.quantity = quantity;
            targetLot.donated = newDonated;
            targetLot.donatedBy = newDonated ? newDonatedBy : '';
            targetLot.note = newNote;
            const updateData = { supplyType: newSupplyType, minQuantity, isDiscrete: newIsDiscrete, stock: target.stock };
            collection.update(_id, updateData);

            return 'Supply updated successfully.';
        }
        return null;
    },
});