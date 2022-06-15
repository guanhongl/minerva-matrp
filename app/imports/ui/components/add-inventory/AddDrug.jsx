import React, { useState, useEffect } from 'react';
import { Grid, Header, Form, Button, Tab, Loader } from 'semantic-ui-react';
import swal from 'sweetalert';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import QRCode from 'qrcode';
import { Random } from 'meteor/random'
import { Drugs, allowedUnits } from '../../../api/drug/DrugCollection';
import { Locations } from '../../../api/location/LocationCollection';
import { DrugTypes } from '../../../api/drugType/DrugTypeCollection';
import { defineMethod, updateMethod } from '../../../api/base/BaseCollection.methods';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { distinct, getOptions, nestedDistinct, printQRCode } from '../../utilities/Functions';

/** handles submit for add medication. */
const submit = (data, callback) => {
  const { drug, drugType, minQuantity, quantity, unit, brand, lotId, expire, location, donated, donatedBy, note } = data;
  const collectionName = Drugs.getCollectionName();
  const exists = Drugs.findOne({ drug }); // returns the existing medication or undefined
  
  // attempts to find an existing _id
  const exists_id = exists?.lotIds?.find(obj => obj.lotId === lotId)?._id;

  // generate the QRCode and the uuid for the lotId
  const _id = exists_id ?? Random.id();
  QRCode.toDataURL(`${window.location.origin}/#/dispense?tab=0&_id=${_id}`)
    .then(url => {
      // if the medication does not exist:
      if (!exists) {
        // insert the new medication and lotId
        const newLot = { _id, lotId, brand, expire, location, quantity, donated, donatedBy, note, QRCode: url };
        const definitionData = { drug, drugType, minQuantity, unit, lotIds: [newLot] };
        defineMethod.callPromise({ collectionName, definitionData })
          .then(() => {
            swal('Success', `${drug}, ${lotId} added successfully`, url, { buttons: ['OK', 'Print'] })
              .then(isPrint => {
                if (isPrint) {
                  printQRCode(url);
                }
              });
            callback(); // resets the form
          })
          .catch(error => swal('Error', error.message, 'error'));
      } else {
        const { lotIds } = exists;
        const target = lotIds.find(obj => obj.lotId === lotId);
        // if lotId exists, increment the quantity:
        if (target) {
          target.quantity += quantity;
        } else {
          // else append the new lotId
          lotIds.push({ _id, lotId, brand, expire, location, quantity, donated, donatedBy, note, QRCode: url });
        }
        const updateData = { id: exists._id, lotIds };
        updateMethod.callPromise({ collectionName, updateData })
          .then(() => {
            swal('Success', `${drug} updated successfully`, url, { buttons: ['OK', 'Print'] })
              .then(isPrint => {
                if (isPrint) {
                  printQRCode(url);
                }
              });
            callback(); // resets the form
          })
          .catch(error => swal('Error', error.message, 'error'));
      }
    })
    .catch(error => swal('Error', error, 'error'));
};

/** validates the add medication form */
const validateForm = (data, callback) => {
  const submitData = { ...data };
  let errorMsg = '';
  // the required String fields
  const requiredFields = ['drug', 'drugType', 'minQuantity', 'lotId', 'brand', 'location', 'quantity'];

  // if the field is empty, append error message
  requiredFields.forEach(field => {
    if (!submitData[field] || (field === 'drugType' && !submitData.drugType.length)) {
      errorMsg += `${field} cannot be empty.\n`;
    }
  });

  if (errorMsg) {
    swal('Error', `${errorMsg}`, 'error');
  } else {
    submitData.minQuantity = parseInt(data.minQuantity, 10);
    submitData.quantity = parseInt(data.quantity, 10);
    submit(submitData, callback);
  }
};

/** Renders the Page for Add Medication. */
const AddDrug = ({ drugTypes, ready, drugs, lotIds, brands, locations }) => {
  const [fields, setFields] = useState({
    drug: '',
    drugType: [],
    minQuantity: '',
    quantity: '',
    unit: 'tab(s)',
    brand: '',
    lotId: '',
    expire: '',
    location: '',
    donated: false,
    donatedBy: '',
    note: '',
  });
  const isDisabled = drugs.includes(fields.drug);

  // a copy of drugs, lotIds, and brands and their respective filters
  const [newDrugs, setNewDrugs] = useState([]);
  useEffect(() => {
    setNewDrugs(drugs);
  }, [drugs]);
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  useEffect(() => {
    setFilteredDrugs(newDrugs);
  }, [newDrugs]);
  const [newLotIds, setNewLotIds] = useState([]);
  useEffect(() => {
    setNewLotIds(lotIds);
  }, [lotIds]);
  const [filteredLotIds, setFilteredLotIds] = useState([]);
  useEffect(() => {
    setFilteredLotIds(newLotIds);
  }, [newLotIds]);
  const [newBrands, setNewBrands] = useState([]);
  useEffect(() => {
    setNewBrands(brands);
  }, [brands]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  useEffect(() => {
    setFilteredBrands(newBrands);
  }, [newBrands]);

  // handles adding a new drug; IS case sensitive
  const onAddDrug = (event, { value }) => {
    if (!newDrugs.map(drug => drug.toLowerCase()).includes(value.toLowerCase())) {
      setNewDrugs([...newDrugs, value]);
    }
  };
  // handles adding a new lotId; IS NOT case sensitive
  const onAddLotId = (event, { value }) => {
    if (!newLotIds.includes(value)) {
      setNewLotIds([...newLotIds, value]);
    }
  };
  // handles adding a new brand; IS case sensitive
  const onAddBrand = (event, { value }) => {
    if (!newBrands.map(brand => brand.toLowerCase()).includes(value.toLowerCase())) {
      setNewBrands([...newBrands, value]);
    }
  };

  const handleChange = (event, { name, value }) => {
    setFields({ ...fields, [name]: value });
  };

  const handleCheck = (event, { name, checked }) => {
    if (!checked) {
      setFields({ ...fields, [name]: checked, donatedBy: '' });
    } else {
      setFields({ ...fields, [name]: checked });
    }
  };

  // handles drug select
  const onDrugSelect = (event, { value: drug }) => {
    const target = Drugs.findOne({ drug });
    // if the drug exists:
    if (target) {
      // autofill the form with specific drug info
      const { drugType, minQuantity, unit, lotIds: lotIdObjs } = target;
      setFields({ ...fields, drug, drugType, minQuantity, unit });
      // filter lotIds and brands
      // TODO: sort?
      setFilteredLotIds(_.pluck(lotIdObjs, 'lotId'));
      // setFilteredBrands(_.uniq(_.pluck(lotIdObjs, 'brand')));
    } else {
      // else reset specific drug info
      setFields({ ...fields, drug, drugType: [], minQuantity: '', unit: 'tab(s)' });
      // reset the filters
      setFilteredLotIds(newLotIds);
      // setFilteredBrands(newBrands);
    }
  };

  // handles lotId select
  const onLotIdSelect = (event, { value: lotId }) => {
    const target = Drugs.findOne({ lotIds: { $elemMatch: { lotId } } });
    // if the lotId exists:
    if (target) {
      // autofill the form with specific lotId info
      const targetLotIds = target.lotIds.find(obj => obj.lotId === lotId);
      const { drug, drugType, minQuantity, unit } = target;
      const { brand, expire, location, donated, donatedBy, note } = targetLotIds;
      const autoFields = { ...fields, lotId, drug, drugType, expire, brand, minQuantity, unit, location,
        donated, donatedBy, note };
      setFields(autoFields);
    } else {
      // else reset specific lotId info
      setFields({ ...fields, lotId, expire: '', brand: '', location: '', donated: false, donatedBy: '', note: '' });
    }
  };

  // handles brand select
  const onBrandSelect = (event, { value: brand }) => {
    setFields({ ...fields, brand });
    // filter drugs
    const filter = distinct('drug', Drugs, { lotIds: { $elemMatch: { brand } } });
    if (filter.length && !fields.drug) {
      setFilteredDrugs(filter);
    } else {
      setFilteredDrugs(newDrugs);
    }
  };

  const clearForm = () => {
    setFields({ drug: '', drugType: [], minQuantity: '', quantity: '', unit: 'tab(s)',
      brand: '', lotId: '', expire: '', location: '', donated: false, donatedBy: '', note: '' });
    setFilteredDrugs(newDrugs);
    setFilteredLotIds(newLotIds);
    setFilteredBrands(newBrands);
  };

  if (ready) {
    return (
      <Tab.Pane id={COMPONENT_IDS.ADD_FORM} >
        <Header as="h2">
          <Header.Content>
              Add Drugs to Inventory Form
            <Header.Subheader>
              <i>Please input the following information to add to the inventory, to the best of your abilities.</i>
            </Header.Subheader>
          </Header.Content>
        </Header>
        {/* Semantic UI Form used for functionality */}
        <Form>
          <Grid columns='equal' stackable>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Drug Name' options={getOptions(filteredDrugs)}
                  placeholder="Benzonatate Capsules" name='drug'
                  onChange={onDrugSelect} value={fields.drug} allowAdditions onAddItem={onAddDrug}
                  id={COMPONENT_IDS.ADD_MEDICATION_DRUG_NAME} />
              </Grid.Column>
              <Grid.Column className='filler-column' />
              <Grid.Column className='filler-column' />
            </Grid.Row>
            <Grid.Row>
              {/* TODO: expand drug type column */}
              <Grid.Column>
                <Form.Select clearable multiple search label='Drug Type(s)' disabled={isDisabled}
                  options={getOptions(drugTypes)} placeholder="Allergy & Cold Medicines"
                  name='drugType' onChange={handleChange} value={fields.drugType} id={COMPONENT_IDS.ADD_MEDICATION_DRUG_TYPE}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Group>
                  <Form.Input label='Minimum Quantity' type='number' min={1} name='minQuantity' className='quantity'
                    onChange={handleChange} value={fields.minQuantity} placeholder="100" disabled={isDisabled}
                    id={COMPONENT_IDS.ADD_MEDICATION_MIN_QUANTITY} />
                  <Form.Select compact name='unit' onChange={handleChange} value={fields.unit} className='unit'
                    options={getOptions(allowedUnits)} disabled={isDisabled} />
                </Form.Group>
              </Grid.Column>
              <Grid.Column className='filler-column' />
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Lot Number' options={getOptions(filteredLotIds)}
                  placeholder="Z9Z99" name='lotId'
                  onChange={onLotIdSelect} value={fields.lotId} allowAdditions onAddItem={onAddLotId}
                  id={COMPONENT_IDS.ADD_MEDICATION_LOT} />
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable search label='Brand' options={getOptions(filteredBrands)}
                  placeholder="Zonatuss" name='brand'
                  onChange={onBrandSelect} value={fields.brand} allowAdditions onAddItem={onAddBrand}
                  id={COMPONENT_IDS.ADD_MEDICATION_BRAND} />
              </Grid.Column>
              <Grid.Column>
                {/* expiration date may be null */}
                <Form.Input type='date' label='Expiration Date' name='expire'
                  onChange={handleChange} value={fields.expire} id={COMPONENT_IDS.ADD_MEDICATION_EXPIRATION} />
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select compact clearable search label='Location' options={getOptions(locations)}
                  placeholder="Case 2" name='location'
                  onChange={handleChange} value={fields.location} id={COMPONENT_IDS.ADD_MEDICATION_LOCATION}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Input label='Quantity' type='number' min={1} name='quantity'
                  onChange={handleChange} value={fields.quantity} placeholder="200"
                  id={COMPONENT_IDS.ADD_MEDICATION_QUANTITY} />
              </Grid.Column>
              <Grid.Column>
                <Form.Field>
                  <label>Donated</label>
                  <Form.Group>
                    <Form.Checkbox name='donated' className='donated-field'
                      onChange={handleCheck} checked={fields.donated}/>
                    <Form.Input name='donatedBy' className='donated-by-field' placeholder='Donated By'
                      onChange={handleChange} value={fields.donatedBy} disabled={!fields.donated} />
                  </Form.Group>
                </Form.Field>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.TextArea label='Additional Notes' name='note' onChange={handleChange} value={fields.note}
                  placeholder="Please add any additional notes, special instructions, or information that should be known here."
                  id={COMPONENT_IDS.ADD_MEDICATION_NOTES}/>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Form>
        <div className='buttons-div'>
          <Button className='clear-button' onClick={clearForm}
            id={COMPONENT_IDS.ADD_MEDICATION_CLEAR}>Clear Fields</Button>
          <Button className='submit-button' floated='right' onClick={() => validateForm(fields, clearForm)}
            id={COMPONENT_IDS.ADD_MEDICATION_SUBMIT}>Submit</Button>
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

/** Require an array of Drugs, DrugTypes, LotIds, Locations, and Brands in the props. */
AddDrug.propTypes = {
  drugs: PropTypes.array.isRequired,
  drugTypes: PropTypes.array.isRequired,
  lotIds: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const typeSub = DrugTypes.subscribeDrugType();
  const locationSub = Locations.subscribeLocation();
  const medSub = Drugs.subscribeDrug();
  return {
    drugs: distinct('drug', Drugs),
    drugTypes: distinct('drugType', DrugTypes),
    lotIds: nestedDistinct('lotId', Drugs),
    locations: distinct('location', Locations),
    brands: nestedDistinct('brand', Drugs),
    ready: typeSub.ready() && locationSub.ready() && medSub.ready(),
  };
})(AddDrug);
