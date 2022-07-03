import React, { useState, useEffect } from 'react';
import { Grid, Form } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { getOptions } from '../../utilities/Functions';
import { findOneMethod } from '../../../api/base/BaseCollection.methods';

const DispenseSupplySingle = ({ names, locations, types, fields, handleChange, handleCheck, handleSelect, index }) => {
  const collectionName = "SupplysCollection";
  const [locationFilter, setLocationFilter] = useState([]);
  useEffect(() => {
    setLocationFilter(locations);
  }, [locations]);

  // handle supply select; filter locations
  const onSupplySelect = (event, obj) => {
    findOneMethod.callPromise({ collectionName, selector: { supply: obj.value } })
      .then(target => {
        // if supply is not empty:
        if (!!target) {
          // setFields({ ...fields, supply });
          handleChange(event, obj);
          setLocationFilter(_.uniq(_.pluck(target.stock, 'location')).sort());
        } else {
          // else reset specific supply info
          // setFields({ ...fields, supply });
          handleChange(event, obj);
          setLocationFilter(locations);
        }
      });
  };

  // autofill form if supply, location, donated are selected
  useEffect(() => {
    if (fields.supply && fields.location) {
      const selector = { supply: fields.supply, stock: { $elemMatch: { location: fields.location, donated: fields.donated } } };
      findOneMethod.callPromise({ collectionName, selector })
        .then(target => {
          // if supply w/ name, location, donated exists:
          if (!!target) {
            // autofill the form with specific supply info
            const { supplyType } = target;

            targetSupply = target.stock.find(obj => obj.location === fields.location && obj.donated === fields.donated);
            const { quantity, donatedBy } = targetSupply;

            // const autoFields = { ...fields, supplyType, donatedBy };
            // setFields(autoFields);
            // setMaxQuantity(quantity);
            const autoFields = { ...fields, supplyType, donatedBy, maxQuantity: quantity };
            handleSelect(autoFields, index);
          } else {
            // setFields({ ...fields, supplyType: '', donatedBy: '' });
            // setMaxQuantity(0);
            const autoFields = { ...fields, supplyType: '', donatedBy: '', maxQuantity: 0 };
            handleSelect(autoFields, index);
          }
        });
    }
  }, [fields.supply, fields.location, fields.donated]);


  return (
    <>
      <Grid.Row>
        <Grid.Column>
          <Form.Select id={COMPONENT_IDS.DISPENSE_SUP_NAME} clearable search label='Supply Name' options={getOptions(names)}
            placeholder="Wipes & Washables/Test Strips/Brace"
            name='supply' onChange={onSupplySelect} value={fields.supply} index={index}/>
        </Grid.Column>
        <Grid.Column>
          <Form.Select id={COMPONENT_IDS.DISPENSE_SUP_LOCATION} clearable search label='Location' options={getOptions(locationFilter)}
            placeholder="Case 2" name='location'
            onChange={handleChange} value={fields.location} index={index}/>
        </Grid.Column>
        <Grid.Column>
          <Form.Group>
            <Form.Input id={COMPONENT_IDS.DISPENSE_SUP_QUANTITY} label={fields.maxQuantity ? `Quantity (${fields.maxQuantity} remaining)` : 'Quantity'}
              type='number' min={1} name='quantity' className='quantity'
              onChange={handleChange} value={fields.quantity} placeholder='30' index={index}/>
          </Form.Group>
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column>
          <Form.Select clearable label='Supply Type' options={getOptions(types)}
              placeholder="Patient" name='supplyType' 
              onChange={handleChange} value={fields.supplyType} index={index} />
        </Grid.Column>
        <Grid.Column>
          <Form.Field>
            <label>Donated</label>
            <Form.Group>
              <Form.Checkbox name='donated' className='donated-field'
                onChange={handleCheck} checked={fields.donated} index={index} />
              <Form.Input id={COMPONENT_IDS.DISPENSE_SUP_DONATED_INPUT} name='donatedBy' className='donated-by-field' placeholder='Donated By'
                onChange={handleChange} value={fields.donatedBy} disabled={!fields.donated} index={index}/>
            </Form.Group>
          </Form.Field>
        </Grid.Column>
        <Grid.Column className='filler-column' />
      </Grid.Row>
    </>
  );
};

DispenseSupplySingle.propTypes = {
  names: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  types: PropTypes.array.isRequired,
  fields: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleCheck: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

export default DispenseSupplySingle;
