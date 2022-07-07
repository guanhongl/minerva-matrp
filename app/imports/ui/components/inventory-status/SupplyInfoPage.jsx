import { Meteor } from 'meteor/meteor';
import React, { useState } from 'react';
import { Button, Modal, Input, TextArea, Select, Icon, Checkbox } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
import { Roles } from 'meteor/alanning:roles';
import { ROLE } from '../../../api/role/Role';
import { updateMethod } from '../../../api/supply/SupplyCollection.methods';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { printQRCode, getOptions } from '../../utilities/Functions';

const submit = (_id, uuid, fields) => {
  updateMethod.callPromise({ _id, uuid, fields })
    .then(success => swal('Success', success, 'success', { buttons: false, timer: 3000 }))
    .catch(error => swal('Error', error.message, 'error'));
};

const SupplyInfoPage = ({ info: { _id, supply, supplyType, minQuantity }, 
                          detail: { _id: uuid, location, quantity, donated, donatedBy, note, QRCode }, 
                          supplyTypes, locations }) => {
  // A reactive data source.
  const isAuth = Roles.userIsInRole(Meteor.userId(), [ROLE.ADMIN, ROLE.SUPERUSER]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);

  // form fields
  const initialState = {
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
              <td>General Info</td>
              <td>
                <div>
                  <span className='header'>Supply:</span>
                  {
                    edit ?
                      <Input value={supply} disabled />
                      :
                      <span>{supply}</span>
                  }
                </div>
                <div>
                  <span className='header'>Supply Type:</span>
                  {
                    edit ?
                      <Select name='newSupplyType' options={getOptions(supplyTypes)}
                        value={fields.newSupplyType} onChange={handleChange} />
                      :
                      <span>{supplyType}</span>
                  }
                </div>
                <div>
                  <span className='header'>Minimum Quantity:</span>
                  {
                    edit ?
                      <Input name='newMinQuantity' type='number' min={1}
                        value={fields.newMinQuantity} onChange={handleChange} />
                      :
                      <span>{minQuantity}</span>
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
                      <Select name='newLocation' value={fields.newLocation} options={getOptions(locations)} onChange={handleChange} />
                      :
                      <span>{location}</span>
                  }
                </div>
                <div>
                  <span className='header'>Quantity:</span>
                  {
                    edit ?
                      <Input name='newQuantity' type='number' min={1}
                        value={fields.newQuantity} onChange={handleChange} />
                      :
                      <span>{quantity}</span>
                  }
                </div>
                <div>
                  <span className='header'>Donated:</span>
                  {
                    edit ?
                      <Checkbox name='newDonated' checked={fields.newDonated} onChange={handleChange} />
                      :
                      <span>{donated ? 'Yes' : 'No'}</span>
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
                        <span>{donatedBy}</span>
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
        {
          isAuth &&
          <>
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
              onClick={() => submit(_id, uuid, fields)}
              color='green'
            />
          </>
        }
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
