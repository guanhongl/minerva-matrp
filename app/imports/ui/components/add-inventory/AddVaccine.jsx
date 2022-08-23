import React, { useState, useEffect, useMemo } from 'react';
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
import { addMethod } from '../../../api/vaccine/VaccineCollection.methods';

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
  const initialState = {
    vaccine: '',
    brand: '',
    minQuantity: '',
    visDate: '',
    lotId: '',
    expire: '',
    location: [],
    quantity: '',
    donated: false,
    donatedBy: '',
    note: '',
  };

  const [fields, setFields] = useState(initialState);
  // disable minimum and vis date if the vaccine, brand pair is populated. 
  const disabled = useMemo(() => {
    const record = Vaccines.findOne({ vaccine: fields.vaccine })

    return !!record
  }, [fields.vaccine])

  // handles vaccine select
  useEffect(() => {
    const target = Vaccines.findOne({ vaccine: fields.vaccine })
    // if the vaccine is populated:
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
      setFilteredLotIds(lotIds);
    }
  }, [fields.vaccine]);

  const [filteredLotIds, setFilteredLotIds] = useState([]);
  useEffect(() => {
    setFilteredLotIds(lotIds);
  }, [lotIds]);

  // handles adding a new lotId
  // restrictions: new lotId cannot be a subset of another; ignores case
  const handleSearch = (event, { name, searchQuery }) => {
    setFields({ ...fields, [name]: searchQuery })
  }

  const handleChange = (event, { name, value, checked }) => {
    setFields({ ...fields, [name]: value ?? checked });
  };

  // handles donated check
  useEffect(() => {
    if (!fields.donated) {
      setFields({ ...fields, donatedBy: "" });
    }
  }, [fields.donated])

  // handles lotId select
  useEffect(() => {
    const selector = { lotIds: { $elemMatch: { lotId: fields.lotId } } }
    const target = Vaccines.findOne(selector)
    // if the lotId exists:
    if (target) {
      // autofill the form with specific lotId info
      const targetLot = target.lotIds.find(o => o.lotId === fields.lotId)
      const { vaccine, minQuantity, visDate } = target
      const { brand, expire = "", location, donated, donatedBy = "", note = "" } = targetLot
      const autoFields = { ...fields, vaccine, expire, brand, visDate, minQuantity, location, donated, donatedBy, note }
      setFields(autoFields)
    } else {
      // else reset specific lotId info
      setFields({ ...fields, brand: '', expire: '', location: [], donated: false, donatedBy: '', note: '' })
    }
  }, [fields.lotId])

  const clearForm = () => {
    setFields(initialState);
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
                  placeholder="COVID-19" name='vaccine' options={getOptions(names)}
                  onChange={handleChange} value={fields.vaccine} id={COMPONENT_IDS.ADD_VACCINATION_VACCINE}/>
              </Grid.Column>
              <Grid.Column className='filler-column' />
              <Grid.Column className='filler-column' />
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Input label='Minimum Quantity' type='number' min={1} name='minQuantity' className='quantity'
                  onChange={handleChange} value={fields.minQuantity} disabled={disabled}
                  placeholder="100" id={COMPONENT_IDS.ADD_VACCINATION_MIN_QUANTITY}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Input type='date' label='VIS Date' name='visDate'
                  onChange={handleChange} value={fields.visDate} disabled={disabled}/>
              </Grid.Column>
              <Grid.Column className="filler-column"/>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Lot Number'
                  placeholder="Z9Z99" name='lotId' options={getOptions(filteredLotIds)} onChange={handleChange}
                  value={fields.lotId} onSearchChange={handleSearch} searchQuery={fields.lotId} id={COMPONENT_IDS.ADD_VACCINATION_LOT}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable search label='Brand'
                  placeholder="Moderna" options={getOptions(brands)}
                  name='brand' onChange={handleChange} value={fields.brand} id={COMPONENT_IDS.ADD_VACCINATION_BRAND}/>
              </Grid.Column>
              <Grid.Column>
                {/* expiration date may be null */}
                <Form.Input type='date' label='Expiration Date' name='expire'
                  onChange={handleChange} value={fields.expire} id={COMPONENT_IDS.ADD_VACCINATION_EXPIRATION}/>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select compact clearable multiple search label='Location'
                  placeholder="Cooler" name='location' options={getLocations(locations)}
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
                      onChange={handleChange} checked={fields.donated}/>
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
  const locationSub = Locations.subscribe();
  const vaccineSub = Vaccines.subscribeVaccine()

  return {
    names: fetchField(VaccineNames, "vaccineName"),
    brands: fetchField(VaccineBrands, "vaccineBrand"),
    lotIds: fetchLots(Vaccines),
    locations: Locations.find({}, { sort: { location: 1 } }).fetch(),
    ready: nameSub.ready() && brandSub.ready() && vaccineSub.ready() && locationSub.ready(), 
  };
})(AddVaccine);
