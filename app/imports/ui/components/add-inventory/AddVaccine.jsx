import React, { useState, useEffect } from 'react';
import { Grid, Header, Form, Button, Tab, Loader } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import swal from 'sweetalert';
import QRCode from 'qrcode';
import { Random } from 'meteor/random'
import { Locations } from '../../../api/location/LocationCollection';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { Vaccines } from '../../../api/vaccine/VaccineCollection';
import { distinct, getOptions, nestedDistinct, printQRCode } from '../../utilities/Functions';
import { defineMethod, updateMethod } from '../../../api/base/BaseCollection.methods';

/** On submit, insert the data. */
const submit = (data, callback) => {
  const { vaccine, minQuantity, quantity, visDate, brand, lotId, expire, location, note } = data;
  const collectionName = Vaccines.getCollectionName();
  const exists = Vaccines.findOne({ vaccine, brand }); // returns the existing vaccine or undefined

  // attempts to find an existing _id
  const exists_id = exists?.lotIds?.find(obj => obj.lotId === lotId)?._id;

  // generate the QRCode and the uuid for the lotId
  const _id = exists_id ?? Random.id();
  QRCode.toDataURL(`${window.location.origin}/#/dispense?tab=1&_id=${_id}`)
    .then(url => {
      // if the vaccine does not exist:
      if (!exists) {
        // insert the new vaccine and lotId
        const newLot = { _id, lotId, expire, location, quantity, note, QRCode: url };
        const definitionData = { vaccine, brand, minQuantity, visDate, lotIds: [newLot] };
        defineMethod.callPromise({ collectionName, definitionData })
          .then(() => {
            swal('Success', `${vaccine}, ${lotId} added successfully`, url, { buttons: ['OK', 'Print'] })
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
          lotIds.push({ _id, lotId, expire, location, quantity, note, QRCode: url });
        }
        const updateData = { id: exists._id, lotIds };
        updateMethod.callPromise({ collectionName, updateData })
          .then(() => {
            swal('Success', `${vaccine} updated successfully`, url, { buttons: ['OK', 'Print'] })
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

/** validates the add vaccination form */
const validateForm = (data, callback) => {
  const submitData = { ...data };
  let errorMsg = '';
  // the required String fields
  const requiredFields = ['vaccine', 'brand', 'minQuantity', 'visDate', 'lotId', 'location', 'quantity'];

  // if the field is empty, append error message
  requiredFields.forEach(field => {
    if (!submitData[field]) {
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

/** Renders the Page for Add Vaccine */
const AddVaccine = ({ ready, vaccines, locations, lotIds, brands }) => {
  const [fields, setFields] = useState({
    vaccine: '',
    brand: '',
    minQuantity: '',
    visDate: '',
    lotId: '',
    expire: '',
    location: '',
    quantity: '',
    note: '',
  });
  const isDisabled = vaccines.includes(fields.vaccine);

  // a copy of vaccines, lotIds, and brands and their respective filters
  const [newVaccines, setNewVaccines] = useState([]);
  useEffect(() => {
    setNewVaccines(vaccines);
  }, [vaccines]);
  const [filteredVaccines, setFilteredVaccines] = useState([]);
  useEffect(() => {
    setFilteredVaccines(newVaccines);
  }, [newVaccines]);
  const [newBrands, setNewBrands] = useState([]);
  useEffect(() => {
    setNewBrands(brands);
  }, [brands]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  useEffect(() => {
    setFilteredBrands(newBrands);
  }, [newBrands]);
  const [newLotIds, setNewLotIds] = useState([]);
  useEffect(() => {
    setNewLotIds(lotIds);
  }, [lotIds]);
  const [filteredLotIds, setFilteredLotIds] = useState([]);
  useEffect(() => {
    setFilteredLotIds(newLotIds);
  }, [newLotIds]);

  // handles adding a new vaccine; IS case sensitive
  const onAddVaccine = (event, { value }) => {
    if (!newVaccines.map(vaccine => vaccine.toLowerCase()).includes(value.toLowerCase())) {
      setNewVaccines([...newVaccines, value]);
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

  // handles vaccine select
  // TODO: consider brand
  const onVaccineSelect = (event, { value: vaccine }) => {
    const target = Vaccines.findOne({ vaccine });
    // if the vaccine exists:
    if (target) {
      // autofill the form with specific vaccine info
      const { brand, minQuantity, visDate, lotIds: lotIdObjs } = target;
      setFields({ ...fields, vaccine, brand, minQuantity, visDate });
      // filter lotIds and brands
      // TODO: sort?
      setFilteredLotIds(_.pluck(lotIdObjs, 'lotId'));
    } else {
      // else reset specific vaccine info
      setFields({ ...fields, vaccine, minQuantity: '', brand: '', visDate: '' });
      // reset the filters
      setFilteredLotIds(newLotIds);
    }
  };

  // handles lotId select
  const onLotIdSelect = (event, { value: lotId }) => {
    const target = Vaccines.findOne({ lotIds: { $elemMatch: { lotId } } });
    // if the lotId exists:
    if (target) {
      // autofill the form with specific lotId info
      const targetLotIds = target.lotIds.find(obj => obj.lotId === lotId);
      const { vaccine, minQuantity, brand, visDate } = target;
      const { expire, location, note } = targetLotIds;
      const autoFields = { ...fields, lotId, vaccine, expire, brand, visDate, minQuantity, location, note };
      setFields(autoFields);
    } else {
      // else reset specific lotId info
      setFields({ ...fields, lotId, expire: '', location: '', note: '' });
    }
  };

  const clearForm = () => {
    setFields({ vaccine: '', brand: '', minQuantity: '', visDate: '', lotId: '', expire: '',
      location: '', quantity: '', note: '' });
    setFilteredVaccines(newVaccines);
    setFilteredLotIds(newLotIds);
    setFilteredBrands(newBrands);
  };

  if (ready) {
    return (
      <Tab.Pane id={COMPONENT_IDS.ADD_FORM}>
        <Header as="h2">
          <Header.Content>
              Add Vaccines to Inventory Form
            <Header.Subheader>
              <i>Please input the following information to add to the inventory, to the best of your abilities.</i>
            </Header.Subheader>
          </Header.Content>
        </Header>
        <Form>
          <Grid columns='equal' stackable>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Vaccine Name'
                  placeholder="J&J COVID" name='vaccine' options={getOptions(filteredVaccines)}
                  onChange={onVaccineSelect} value={fields.vaccine}
                  allowAdditions onAddItem={onAddVaccine} id={COMPONENT_IDS.ADD_VACCINATION_VACCINE}/>
              </Grid.Column>
              <Grid.Column className='filler-column' />
              <Grid.Column className='filler-column' />
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Manufacturer Brand'
                  placeholder="ACAM2000 Sanofi Pasteur" options={getOptions(filteredBrands)}
                  name='brand' onChange={handleChange} value={fields.brand}
                  allowAdditions onAddItem={onAddBrand} id={COMPONENT_IDS.ADD_VACCINATION_BRAND} disabled={isDisabled}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Input label='Minimum Quantity' type='number' min={1} name='minQuantity' className='quantity'
                  onChange={handleChange} value={fields.minQuantity} disabled={isDisabled}
                  placeholder="100" id={COMPONENT_IDS.ADD_VACCINATION_MIN_QUANTITY}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Input type='date' label='VIS Date' name='visDate'
                  onChange={handleChange} value={fields.visDate} disabled={isDisabled}/>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Lot Number'
                  placeholder="Z9Z99" name='lotId' options={getOptions(filteredLotIds)} onChange={onLotIdSelect}
                  value={fields.lotId} allowAdditions onAddItem={onAddLotId} id={COMPONENT_IDS.ADD_VACCINATION_LOT}/>
              </Grid.Column>
              <Grid.Column>
                {/* expiration date may be null */}
                <Form.Input type='date' label='Expiration Date' name='expire'
                  onChange={handleChange} value={fields.expire} id={COMPONENT_IDS.ADD_VACCINATION_EXPIRATION}/>
              </Grid.Column>
              <Grid.Column className='filler-column'/>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select compact clearable search label='Location'
                  placeholder="Case 2" name='location' options={getOptions(locations)}
                  onChange={handleChange} value={fields.location} id={COMPONENT_IDS.ADD_VACCINATION_LOCATION}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Input label='Quantity' type='number' min={1} name='quantity'
                  onChange={handleChange} value={fields.quantity} placeholder="200"
                  id={COMPONENT_IDS.ADD_VACCINATION_QUANTITY}/>
              </Grid.Column>
              <Grid.Column className='filler-column'/>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.TextArea label='Additional Notes' name='note' onChange={handleChange} value={fields.note}
                  id={COMPONENT_IDS.ADD_VACCINATION_NOTES}
                  placeholder="Please add any additional notes, special instructions, or information that should be known here."/>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Form>
        <div className='buttons-div'>
          <Button className='clear-button'onClick={clearForm} id={COMPONENT_IDS.ADD_VACCINATION_CLEAR}>Clear Fields</Button>
          <Button className='submit-button' floated='right' onClick={() => validateForm(fields, clearForm)}
            id={COMPONENT_IDS.ADD_VACCINATION_SUBMIT}>Submit</Button>
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

/** Require an array of Stuff documents in the props. */
AddVaccine.propTypes = {
  vaccines: PropTypes.array.isRequired,
  lotIds: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const locationSub = Locations.subscribeLocation();
  const vacSub = Vaccines.subscribeVaccine();
  return {
    vaccines: distinct('vaccine', Vaccines),
    lotIds: nestedDistinct('lotId', Vaccines),
    locations: distinct('location', Locations),
    brands: distinct('brand', Vaccines),
    ready: locationSub.ready() && vacSub.ready(),

  };
})(AddVaccine);
