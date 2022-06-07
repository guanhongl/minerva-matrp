import React, { useState } from 'react';
import { Button, Modal, Input, TextArea, Select, Icon, Checkbox } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { Supplys } from '../../../api/supply/SupplyCollection';
import { updateMethod } from '../../../api/base/BaseCollection.methods';
import { printQRCode, getOptions } from '../../utilities/Functions';

const SupplyInfoPage = ({ info: { _id, supply, supplyType, minQuantity }, 
                          detail: { _id: uuid, location, quantity, donated, donatedBy, note, QRCode }, 
                          locations, supplyTypes }) => {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);

  // form fields
  const initialState = {
    newSupply: supply,
    newSupplyType: supplyType,
    newMinQuantity: minQuantity,
    newLocation: location,
    newQuantity: quantity,
    newDonated: donated,
    newDonatedBy: donatedBy,
    newNote: note,
  };

  const [fields, setFields] = useState(initialState);

  const handleEdit = () => {
    setEdit(!edit);
    setFields(initialState);
  }

  const handleChange = (event, { name, value, checked }) => {
    setFields({ ...fields, [name]: value ?? checked });
  };

  const submit = () => {
    fields.newMinQuantity = parseInt(fields.newMinQuantity, 10);
    fields.newQuantity = parseInt(fields.newQuantity, 10);

    const collectionName = Supplys.getCollectionName();
    const exists = Supplys.findOne({ _id });
    const { stock } = exists;
    const target = stock.find(obj => obj._id === uuid);
    target.location = fields.newLocation;
    target.quantity = fields.newQuantity;
    target.donated = fields.newDonated;
    target.donatedBy = fields.newDonated ? fields.newDonatedBy : '';
    target.note = fields.newNote;
    const updateData = { id: _id, supply: fields.newSupply, supplyType: fields.newSupplyType, minQuantity: fields.newMinQuantity, stock };
    updateMethod.callPromise({ collectionName, updateData })
      .then(() => swal('Success', 'Supply updated successfully', 'success', { buttons: false, timer: 3000 }))
      .catch(error => swal('Error', error.message, 'error'));
  };

  return (
    <Modal
      closeIcon
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Icon name='info' id={COMPONENT_IDS.SUPPLY_INFO_BUTTON}/>}
      size='small'
      id={COMPONENT_IDS.SUPPLY_INFO}
      className='info-modal'
    >
      <Modal.Header>Supply Information</Modal.Header>
      <Modal.Content scrolling>
        <table>
          <tbody>
            <tr>
              <td style={{ width: '150px' }}>General Info</td>
              <td>
                <div>
                  <span className='header'>Supply:</span>
                  {
                    edit ?
                      <Input name='newSupply' value={fields.newSupply} onChange={handleChange} />
                      :
                      <>{supply}</>
                  }
                </div>
                <div>
                  <span className='header'>Supply Type:</span>
                  {
                    edit ?
                      <Select name='newSupplyType' options={getOptions(supplyTypes)}
                        value={fields.newSupplyType} onChange={handleChange} />
                      :
                      <>{supplyType}</>
                  }
                </div>
                <div>
                  <span className='header'>Minimum Quantity:</span>
                  {
                    edit ?
                      <Input name='newMinQuantity' type='number' min={1}
                        value={fields.newMinQuantity} onChange={handleChange} />
                      :
                      <>{minQuantity}</>
                  }
                </div>
              </td>
            </tr>
            <tr>
              <td>Details</td>
              <td>
                <div>
                  <span className='header'>Location:</span>
                  {
                    edit ?
                      <Select name='newLocation' options={getOptions(locations)}
                        value={fields.newLocation} onChange={handleChange} />
                      :
                      <>{location}</>
                  }
                </div>
                <div>
                  <span className='header'>Quantity:</span>
                  {
                    edit ?
                      <Input name='newQuantity' type='number' min={1}
                        value={fields.newQuantity} onChange={handleChange} />
                      :
                      <>{quantity}</>
                  }
                </div>
                <div>
                  <span className='header'>Donated:</span>
                  {
                    edit ?
                      <Checkbox name='newDonated' checked={fields.newDonated} onChange={handleChange} />
                      :
                      <>{donated ? 'Yes' : 'No'}</>
                  }
                </div>
                {
                  fields.newDonated &&
                  <div>
                    <span className='header'>Donated By:</span>
                    {
                      edit ?
                        <Input name='newDonatedBy' value={fields.newDonatedBy} onChange={handleChange} />
                        :
                        <>{donatedBy}</>
                    }
                  </div>
                }
              </td>
            </tr>
            <tr>
              <td>Note</td>
              <td>
                <TextArea rows={3} name='newNote' value={fields.newNote} onChange={handleChange} />
              </td>
            </tr>
          </tbody>
        </table>
      </Modal.Content>
      <Modal.Actions>
        {
          QRCode &&
          <Button
            circular
            // content="Print QR Code"
            // labelPosition='right'
            icon='qrcode'
            onClick={() => printQRCode(QRCode)}
            color='black'
          />
        }
        <Button
          circular
          icon={edit ? 'ban' : 'pencil'}
          onClick={handleEdit}
          color='linkedin'
        />
        <Button
          circular
          // id={COMPONENT_IDS.SUPPLY_INFO_EDIT}
          // content="Save Changes"
          // labelPosition='right'
          icon='check'
          onClick={submit}
          color='green'
        />
        {/* <Button color='black' onClick={() => setOpen(false)} id={COMPONENT_IDS.SUPPLY_INFO_CLOSE}>
          Close
        </Button> */}
      </Modal.Actions>
    </Modal>
  );
};

// Require a document to be passed to this component.
SupplyInfoPage.propTypes = {
  info: PropTypes.object.isRequired,
  detail: PropTypes.object.isRequired,
};

export default SupplyInfoPage;
