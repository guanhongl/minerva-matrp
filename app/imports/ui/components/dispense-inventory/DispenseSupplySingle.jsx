import React, { useEffect } from 'react';
import { Grid, Form } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { getOptions } from '../../utilities/Functions';

const DispenseSupplySingle = ({ names, types, fields, handleChange, setSupply, index }) => {
  // handle supply, donated select
  useEffect(() => {
    setSupply(index)
  }, [fields.supply, fields.donated])

  return (
    <>
      <Grid.Row className="dispense-single">
        <Grid.Column>
          <Form.Select id={COMPONENT_IDS.DISPENSE_SUP_NAME} clearable search label='Supply Name' options={getOptions(names)}
            placeholder="Wipes & Washables/Test Strips/Brace"
            name='supply' onChange={handleChange} value={fields.supply} index={index}/>
        </Grid.Column>
        <Grid.Column>
          <Form.Select clearable label='Supply Type' options={getOptions(types)}
              placeholder="Patient" name='supplyType' 
              onChange={handleChange} value={fields.supplyType} index={index} />
        </Grid.Column>
        <Grid.Column className='filler-column' />
      </Grid.Row>
      <Grid.Row>
        <Grid.Column>
          <Form.Field>
            <label>Has Quantity</label>
            <Form.Checkbox name="isDiscrete" onChange={handleChange} checked={fields.isDiscrete} index={index} />
          </Form.Field>
        </Grid.Column>
        <Grid.Column>
          <Form.Group>
            <Form.Input id={COMPONENT_IDS.DISPENSE_SUP_QUANTITY} label={fields.maxQuantity ? `Quantity (${fields.maxQuantity} remaining)` : 'Quantity'}
              type='number' min={1} name='quantity' className='quantity' disabled={!fields.isDiscrete}
              onChange={handleChange} value={fields.quantity} placeholder='30' index={index}/>
          </Form.Group>
        </Grid.Column>
        <Grid.Column>
          <Form.Field>
            <label>Donated</label>
            <Form.Group>
              <Form.Checkbox name='donated' className='donated-field'
                onChange={handleChange} checked={fields.donated} index={index} />
              <Form.Input id={COMPONENT_IDS.DISPENSE_SUP_DONATED_INPUT} name='donatedBy' className='donated-by-field' placeholder='Donated By'
                onChange={handleChange} value={fields.donatedBy} disabled={!fields.donated} index={index}/>
            </Form.Group>
          </Form.Field>
        </Grid.Column>
      </Grid.Row>
    </>
  );
};

DispenseSupplySingle.propTypes = {
  names: PropTypes.array.isRequired,
  types: PropTypes.array.isRequired,
  fields: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  setSupply: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

export default DispenseSupplySingle;
