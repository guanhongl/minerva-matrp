import { Meteor } from 'meteor/meteor';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { _ } from 'meteor/underscore';
import { MATRP } from '../matrp/MATRP';
import QRCode from 'qrcode';
import { Random } from 'meteor/random';
import { cloneDeep } from 'lodash';

export const getGenericNames = new ValidatedMethod({
    name: 'drug.getGenericNames',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ drugBrand }) {
        if (Meteor.isServer) {
            const collection = MATRP.drugs;
            collection.assertValidRoleForMethod(this.userId);

            if (!drugBrand) {
                return false
            }

            const genericName = MATRP.drugBrands.findOne({ drugBrand }).genericName;
            return _.pluck(
                // MATRP.drugNames.find().fetch().filter(o => o.drugName.includes(genericName)),
                MATRP.drugNames.find({ drugName: { $regex: genericName } }, { sort: { drugName: 1 } }).fetch(),
                "drugName",
            );
        }
        return null;
    },
});

export const getBrandNames = new ValidatedMethod({
    name: 'drug.getBrandNames',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ genericName }) {
        if (Meteor.isServer) {
            const collection = MATRP.drugs;
            collection.assertValidRoleForMethod(this.userId);
            
            if (!genericName) {
                return false
            }

            return _.pluck(
                MATRP.drugBrands.find().fetch().filter(o => genericName.includes(o.genericName)),
                "drugBrand",
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
            const requiredFields = ['drug', 'drugType', 'minQuantity', 'lotId', 'location', 'quantity'];
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
                const URL = Meteor.absoluteUrl(`/#/dispense/drug?_id=${_id}`);
                
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

export const dispenseMethod = new ValidatedMethod({
    name: 'drug.dispense',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ fields, innerFields }) {
        if (Meteor.isServer) {
            const collection = MATRP.drugs;
            const history = MATRP.history;
            collection.assertValidRoleForMethod(this.userId);

            // handle non patient use dispense
            if (fields.dispenseType !== 'Patient Use') {
                fields.dispensedTo = 'N/A';
                fields.site = 'N/A';
            }
            // validation
            let errorMsg = '';
            // the required String fields
            const requiredFields = ['dispensedTo', 'site'];
            const requiredInnerFields = ['drug', 'lotId', 'quantity'];
            // if the field is empty, append error message
            requiredFields.forEach(field => {
                if (!fields[field]) {
                    errorMsg += `${field} cannot be empty.\n`;
                }
            });
            requiredInnerFields.forEach(field => {
                if (innerFields.findIndex(o => o[field] === '') !== -1) { // if any required inner fields are empty
                    errorMsg += `${field} cannot be empty.\n`;
                }
            });
            if (errorMsg) {
                throw new Meteor.Error("required-fields", errorMsg);
            }

            // submit
            fields.dispensedFrom = Meteor.user().username;
            innerFields.forEach(o => {
                o.quantity = parseInt(o.quantity, 10);
            });

            const { site, dateDispensed, dispensedTo, dispensedFrom, inventoryType, dispenseType, note } = fields;
            const copy = []; // the copy of records to update
            const update = []; // the records to update
            const element = []; // the historical record elements
            let successMsg = '';
            
            innerFields.forEach(innerField => {
                const { lotId, drug, brand, expire, quantity, unit, donated, donatedBy } = innerField;
                const target = collection.findOne({ drug }); // find the existing drug
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
                    throw new Meteor.Error("quantity-cap", `${drug}, ${lotId} only has ${targetQuantity} ${unit} remaining.`);
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
                element.push({ name: drug, unit, lotId, brand, expire, quantity, donated, donatedBy });
                successMsg += `${drug}, ${lotId} updated successfully.\n`;
            });

            try {
                // console.log(update)
                // update.forEach(({ lotIds }) => console.log(lotIds))
                collection.updateMany(update);
                const definitionData = { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site,
                    note, element };
                history.define(definitionData);

                return successMsg;
            } catch (error) {
            // if update or define fail, restore the copy
                collection.updateMany(copy);

                throw new Meteor.Error("update-error", error);
            };
        }
        return null;
    },
});

export const updateMethod = new ValidatedMethod({
    name: 'drug.update',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ _id, uuid, fields }) {
        if (Meteor.isServer) {
            const collection = MATRP.drugs;
            // collection.assertValidRoleForMethod(this.userId);
            collection.assertValidRoleForUpdate(this.userId);
            const { newDrugType, newMinQuantity, newUnit, 
                newLotId, newBrand, newExpire, newLocation, newQuantity, newDonated, newDonatedBy, newNote } = fields;
            
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
            targetLot.brand = newBrand;
            targetLot.expire = newExpire;
            targetLot.location = newLocation;
            targetLot.quantity = quantity;
            targetLot.donated = newDonated;
            targetLot.donatedBy = newDonated ? newDonatedBy : '';
            targetLot.note = newNote;
            const updateData = { drugType: newDrugType, minQuantity, unit: newUnit, lotIds: target.lotIds };
            collection.update(_id, updateData);

            return 'Drug updated successfully.';
        }
        return null;
    },
});