import React, { useState, useEffect } from 'react';
import { Grid, Header, Form, Button, Tab, Loader } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import swal from 'sweetalert';
import { Vaccines } from '../../../api/vaccine/VaccineCollection';
import { VaccineNames } from '../../../api/vaccineName/VaccineNameCollection';
import { VaccineBrands } from '../../../api/vaccineBrand/VaccineBrandCollection';
import { Locations } from '../../../api/location/LocationCollection';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { fetchField, fetchLots, getOptions, getLocations, printQRCode } from '../../utilities/Functions';
import { findOneMethod } from '../../../api/base/BaseCollection.methods';
import { addMethod, brandFilterMethod } from '../../../api/vaccine/VaccineCollection.methods';

/** On submit, insert the data. */
const submit = (data, callback) => {
  addMethod.callPromise({ data })
    .then(url => {
      swal('Success', `${data.vaccine}, ${data.lotId} updated successfully`, url, { buttons: ['OK', 'Print'] })
        .then(isPrint => {
          if (isPrint) {
            printQRCode(url);
          }
        });
      callback(); // resets the form
    })
    .catch(error => swal('Error', error.message, 'error'));
};

/** Renders the Page for Add Vaccine */
const AddVaccine = ({ ready, names, brands, lotIds, locations }) => {
  const collectionName = Vaccines.getCollectionName();
  const initialState = {
    vaccine: '',
    brand: '',
    minQuantity: '',
    visDate: '',
    lotId: '',
    expire: '',
    location: '',
    quantity: '',
    donated: false,
    donatedBy: '',
    note: '',
  };

  const [fields, setFields] = useState(initialState);
  const [disabled, setDisabled] = useState(false);
  useEffect(() => {
    const selector = { vaccine: fields.vaccine, brand: fields.brand };
    findOneMethod.callPromise({ collectionName, selector })
      .then(target => {
        // disable minimum and vis date if the vaccine, brand pair is populated. 
        setDisabled(!!target);
        // handles vaccine, brand pair select
        if (target) {
          // autofill the form with specific vaccine, brand pair info
          const { minQuantity, visDate, lotIds } = target;
          setFields({ ...fields, minQuantity, visDate });
          // filter lotIds
          setFilteredLotIds(_.pluck(lotIds, 'lotId').sort());
        } else {
          // else reset info
          setFields({ ...fields, minQuantity: '', visDate: '' });
          // reset the filters
          setFilteredLotIds(newLotIds);
        }
      });
  }, [fields.vaccine, fields.brand]);

  const [newLotIds, setNewLotIds] = useState([]);
  useEffect(() => {
    setNewLotIds(lotIds);
  }, [lotIds]);
  const [filteredLotIds, setFilteredLotIds] = useState([]);
  useEffect(() => {
    setFilteredLotIds(newLotIds);
  }, [newLotIds]);

  const [filteredNames, setFilteredNames] = useState([]);
  useEffect(() => {
    setFilteredNames(names);
  }, [names])

  // handles adding a new lotId; IS NOT case sensitive
  const onAddLotId = (event, { value }) => {
    if (!newLotIds.includes(value)) {
      setNewLotIds([...newLotIds, value]);
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

  // handles lotId select
  const onLotIdSelect = (event, { value: lotId }) => {
    const selector = { lotIds: { $elemMatch: { lotId } } };
    findOneMethod.callPromise({ collectionName, selector })
      .then(target => {
        // if the lotId exists:
        if (target) {
          // autofill the form with specific lotId info
          const targetLotIds = target.lotIds.find(obj => obj.lotId === lotId);
          const { vaccine, brand, minQuantity, visDate } = target;
          const { expire = "", location, donated, donatedBy = "", note = "" } = targetLotIds;
          const autoFields = { ...fields, lotId, vaccine, expire, brand, visDate, minQuantity, location, donated, donatedBy, note };
          setFields(autoFields);
        } else {
          // else reset specific lotId info
          setFields({ ...fields, lotId, expire: '', location: '', donated: false, donatedBy: '', note: '' });
        }
      });
  };

  // handles brand select
  const onBrandSelect = (event, { value: brand }) => {
    setFields({ ...fields, brand });
    brandFilterMethod.callPromise({ brand })
      .then(filter => {
        // filter vaccine name
        if (filter.length && !fields.vaccine) {
          setFilteredNames(filter);
        } else {
          setFilteredNames(names);
        }
      });
  };

  const clearForm = () => {
    setFields(initialState);
    setFilteredLotIds(newLotIds);
    setFilteredNames(names);
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
                  placeholder="J&J COVID" name='vaccine' options={getOptions(filteredNames)}
                  onChange={handleChange} value={fields.vaccine} id={COMPONENT_IDS.ADD_VACCINATION_VACCINE}/>
              </Grid.Column>
              <Grid.Column className='filler-column' />
              <Grid.Column className='filler-column' />
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Manufacturer Brand'
                  placeholder="ACAM2000 Sanofi Pasteur" options={getOptions(brands)}
                  name='brand' onChange={onBrandSelect} value={fields.brand} id={COMPONENT_IDS.ADD_VACCINATION_BRAND}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Input label='Minimum Quantity' type='number' min={1} name='minQuantity' className='quantity'
                  onChange={handleChange} value={fields.minQuantity} disabled={disabled}
                  placeholder="100" id={COMPONENT_IDS.ADD_VACCINATION_MIN_QUANTITY}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Input type='date' label='VIS Date' name='visDate'
                  onChange={handleChange} value={fields.visDate} disabled={disabled}/>
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
                  placeholder="Case 2" name='location' options={getLocations(locations)}
                  onChange={handleChange} value={fields.location} id={COMPONENT_IDS.ADD_VACCINATION_LOCATION}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Input label='Quantity' type='number' min={1} name='quantity'
                  onChange={handleChange} value={fields.quantity} placeholder="200"
                  id={COMPONENT_IDS.ADD_VACCINATION_QUANTITY}/>
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
                  id={COMPONENT_IDS.ADD_VACCINATION_NOTES}
                  placeholder="Please add any additional notes, special instructions, or information that should be known here."/>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Form>
        <div className='buttons-div'>
          <Button className='clear-button'onClick={clearForm} id={COMPONENT_IDS.ADD_VACCINATION_CLEAR}>Clear Fields</Button>
          <Button className='submit-button' floated='right' onClick={() => submit(fields, clearForm)}
            id={COMPONENT_IDS.ADD_VACCINATION_SUBMIT}>Submit</Button>
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

/** Require ... in the props. */
AddVaccine.propTypes = {
  names: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  lotIds: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const nameSub = VaccineNames.subscribe();
  const brandSub = VaccineBrands.subscribe();
  const lotSub = Vaccines.subscribeVaccineLots();
  const locationSub = Locations.subscribe();

  return {
    names: fetchField(VaccineNames, "vaccineName"),
    brands: fetchField(VaccineBrands, "vaccineBrand"),
    lotIds: fetchLots(Vaccines),
    locations: Locations.find({}, { sort: { location: 1 } }).fetch(),
    ready: nameSub.ready() && brandSub.ready() && lotSub.ready() && locationSub.ready(), 
  };
})(AddVaccine);
