import React, { useState, useEffect, useMemo } from 'react';
import { Grid, Header, Form, Button, Tab, Loader } from 'semantic-ui-react';
import swal from 'sweetalert';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import { Drugs } from '../../../api/drug/DrugCollection';
import { DrugNames } from '../../../api/drugName/DrugNameCollection';
import { DrugTypes } from '../../../api/drugType/DrugTypeCollection';
import { Units } from '../../../api/unit/UnitCollection';
import { DrugBrands } from '../../../api/drugBrand/DrugBrandCollection';
import { Locations } from '../../../api/location/LocationCollection';
import { addMethod, getGenericNames, getBrandNames } from '../../../api/drug/DrugCollection.methods';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { fetchField, fetchLots, getOptions, getLocations, printQRCode } from '../../utilities/Functions';

/** handles submit for add medication. */
const submit = (data, callback) => {
  addMethod.callPromise({ data })
    .then(url => {
      swal('Success', `${data.drug}, ${data.lotId} updated successfully`, url, { buttons: ['OK', 'Print'] })
        .then(isPrint => {
          if (isPrint) {
            printQRCode(url);
          }
        });
      callback(); // resets the form
    })
    .catch(error => swal('Error', error.message, 'error'));
};

/** Renders the Page for Add Medication. */
const AddDrug = ({ ready, names, drugTypes, units, brands, lotIds, locations }) => {
  const initialState = {
    drug: '',
    drugType: [],
    minQuantity: '',
    quantity: '',
    unit: 'tab(s)',
    brand: '',
    lotId: '',
    expire: '',
    location: [],
    donated: false,
    donatedBy: '',
    note: '',
  };

  const [fields, setFields] = useState(initialState);
  // disable drug type, minimum, and unit if the drug is populated. 
  const disabled = useMemo(() => {
    const record = Drugs.findOne({ drug: fields.drug })

    return !!record
  }, [fields.drug])

  const [genericNames, setGenericNames] = useState([])
  // get the generic name(s); select w/ brand name(s)
  useEffect(() => {
    getOptions()

    async function getOptions() {
      const options = await getGenericNames.callPromise({ drugBrand: fields.brand })
      if (options) {
        setGenericNames(options)
      } else {
        setGenericNames(names)
      }
    }
  }, [names, fields.brand])

  const [brandNames, setBrandNames] = useState([])
  // get the brand name(s); select w/ generic name(s)
  useEffect(() => {
    getOptions()

    async function getOptions() {
      const options = await getBrandNames.callPromise({ genericName: fields.drug })
      if (options) {
        setBrandNames(options)
      } else {
        setBrandNames(brands)
      }
    }
  }, [brands, fields.drug])
  
  const [filteredLotIds, setFilteredLotIds] = useState([]);
  useEffect(() => {
    setFilteredLotIds(lotIds);
  }, [lotIds]);

  // handles adding a new lotId
  // restrictions: new lotId cannot be a subset of another; ignores case
  const handleSearch = (event, { name, searchQuery }) => {
    setFields({ ...fields, [name]: searchQuery })
  }
  // const handleClose = (event, data) => {
  // }

  const handleChange = (event, { name, value, checked }) => {
    setFields({ ...fields, [name]: value ?? checked });
  };

  // handles donated check
  useEffect(() => {
    if (!fields.donated) {
      setFields({ ...fields, donatedBy: "" });
    }
  }, [fields.donated])

  // handles drug select
  useEffect(() => {
    const target = Drugs.findOne({ drug: fields.drug })
    // if the drug is populated:
    if (target) {
      // autofill the form with specific drug info
      const { drugType, minQuantity, unit, lotIds } = target
      setFields({ ...fields, drugType, minQuantity, unit })
      // filter lotIds
      setFilteredLotIds(_.pluck(lotIds, 'lotId').sort())
    } else {
      // else reset specific drug info
      setFields({ ...fields, drugType: [], minQuantity: '', unit: 'tab(s)' })
      // reset the lotIds
      setFilteredLotIds(lotIds)
    }
  }, [fields.drug])

  // handles lotId select
  useEffect(() => {
    const selector = { lotIds: { $elemMatch: { lotId: fields.lotId } } }
    const target = Drugs.findOne(selector)
    // if the lotId exists:
    if (target) {
      // autofill the form with specific lotId info
      const targetLot = target.lotIds.find(o => o.lotId === fields.lotId)
      const { drug, drugType, minQuantity, unit } = target
      const { brand = "", expire = "", location, donated, donatedBy = "", note = "" } = targetLot
      const autoFields = { ...fields, drug, drugType, expire, brand, minQuantity, unit, location,
        donated, donatedBy, note }
      setFields(autoFields)
    } else {
      // else reset specific lotId info
      setFields({ ...fields, expire: '', brand: '', location: [], donated: false, donatedBy: '', note: '' })
    }
  }, [fields.lotId])

  const clearForm = () => {
    setFields(initialState);
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
        <Form>
          <Grid columns='equal' stackable>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Drug Name' options={getOptions(genericNames)}
                  placeholder="Acetaminophen 160mg" name='drug' onChange={handleChange} value={fields.drug}
                  id={COMPONENT_IDS.ADD_MEDICATION_DRUG_NAME} />
              </Grid.Column>
              <Grid.Column className='filler-column' />
              <Grid.Column className='filler-column' />
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable multiple search label='Drug Type(s)' disabled={disabled}
                  options={getOptions(drugTypes)} placeholder="Analgesics"
                  name='drugType' onChange={handleChange} value={fields.drugType} id={COMPONENT_IDS.ADD_MEDICATION_DRUG_TYPE}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Group>
                  <Form.Input label='Minimum Quantity' type='number' min={1} name='minQuantity' className='quantity'
                    onChange={handleChange} value={fields.minQuantity} placeholder="100" disabled={disabled}
                    id={COMPONENT_IDS.ADD_MEDICATION_MIN_QUANTITY} />
                  <Form.Select compact name='unit' onChange={handleChange} value={fields.unit} className='unit'
                    options={getOptions(units)} disabled={disabled} />
                </Form.Group>
              </Grid.Column>
              <Grid.Column className='filler-column' />
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Lot Number' options={getOptions(filteredLotIds)}
                  placeholder="Z9Z99" name='lotId'
                  onChange={handleChange} value={fields.lotId} onSearchChange={handleSearch} searchQuery={fields.lotId}
                  id={COMPONENT_IDS.ADD_MEDICATION_LOT} />
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable search label='Brand' options={getOptions(brandNames)}
                  placeholder="Tylenol" name='brand' onChange={handleChange} value={fields.brand}
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
                <Form.Select compact clearable multiple search label='Location' options={getLocations(locations)}
                  placeholder="Case 1" name='location'
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
                  placeholder="Please add any additional notes, special instructions, or information that should be known here."
                  id={COMPONENT_IDS.ADD_MEDICATION_NOTES}/>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Form>
        <div className='buttons-div'>
          <Button className='clear-button' onClick={clearForm}
            id={COMPONENT_IDS.ADD_MEDICATION_CLEAR}>Clear Fields</Button>
          <Button className='submit-button' floated='right' onClick={() => submit(fields, clearForm)}
            id={COMPONENT_IDS.ADD_MEDICATION_SUBMIT}>Submit</Button>
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

AddDrug.propTypes = {
  names: PropTypes.array.isRequired,
  drugTypes: PropTypes.array.isRequired,
  units: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  lotIds: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const nameSub = DrugNames.subscribe();
  const typeSub = DrugTypes.subscribe();
  const unitSub = Units.subscribe();
  const brandSub = DrugBrands.subscribe();
  const locationSub = Locations.subscribe();
  const drugSub = Drugs.subscribeDrug()

  return {
    names: fetchField(DrugNames, "drugName"),
    drugTypes: fetchField(DrugTypes, "drugType"),
    units: fetchField(Units, "unit"),
    brands: fetchField(DrugBrands, "drugBrand"),
    lotIds: fetchLots(Drugs),
    locations: Locations.find({}, { sort: { location: 1 } }).fetch(),
    ready: nameSub.ready() && typeSub.ready() && unitSub.ready() && 
      brandSub.ready() && drugSub.ready() && locationSub.ready(),
  };
})(AddDrug);
