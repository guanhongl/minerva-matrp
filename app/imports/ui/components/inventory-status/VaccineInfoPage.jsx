import React, { useState } from 'react';
import { Button, Modal, Form } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
import moment from 'moment';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { Vaccinations } from '../../../api/vaccination/VaccinationCollection';
import { updateMethod } from '../../../api/base/BaseCollection.methods';
import { printQRCode } from '../../utilities/Functions';

const VaccineInfoPage = ({ info: { _id, vaccine, brand, minQuantity, visDate }, detail: { lotId, expire, location, quantity, note, QRCode } }) => {
  const [open, setOpen] = useState(false);

  // useState for note field when editing notes.
  const [newNote, setNewNote] = useState(note);

  const submit = (data) => {
    const collectionName = Vaccinations.getCollectionName();
    const exists = Vaccinations.findOne({ _id });
    const { lotIds } = exists;
    const target = lotIds.find(obj => obj.lotId === lotId);
    target.note = newNote;
    const updateData = { id: _id, lotIds };
    updateMethod.callPromise({ collectionName, updateData })
      .then(() => swal('Success', 'Note updated successfully', 'success', { buttons: false, timer: 3000 }))
      .catch(error => swal('Error', error.message, 'error'));
  };

  const deleteOption = () => {
    swal({
      title: 'Are you sure?',
      text: `Do you really want to delete ${lotId}?`,
      icon: 'warning',
      buttons: [
        'No, cancel it!',
        'Yes, I am sure!',
      ],
      dangerMode: true,
    })
      .then((isConfirm) => {
        // if 'yes'
        if (isConfirm) {
          const collectionName = Vaccinations.getCollectionName();
          const exists = Vaccinations.findOne({ vaccine });
          const { lotIds } = exists;
          const targetIndex = lotIds.findIndex((obj => obj.lotId === lotId));
          lotIds.splice(targetIndex, 1);
          const updateData = { id: _id, lotIds };
          updateMethod.callPromise({ collectionName, updateData })
            .then(() => swal('Success', `${vaccine} updated successfully`, 'success', { buttons: false, timer: 3000 }))
            .catch(error => swal('Error', error.message, 'error'));
        }
      });
  };

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Button size='mini' circular icon='info' color='linkedin' id={COMPONENT_IDS.VACCINE_INFO_BUTTON}/>}
      size='small'
      id={COMPONENT_IDS.VACCINE_INFO}
      className='info-modal'
    >
      <Modal.Header>Vaccine Information</Modal.Header>
      <Modal.Content scrolling>
        <table>
          <tbody>
            <tr>
              <td style={{ width: '150px' }}>General Info</td>
              <td>
                <div>
                  <span className='header'>Vaccine:</span>
                  {vaccine}
                </div>
                <div>
                  <span className='header'>Brand:</span>
                  {brand}
                </div>
                <div>
                  <span className='header'>Minimum Quantity:</span>
                  {minQuantity}
                </div>
                <div>
                  <span className='header'>VIS Date:</span>
                  {moment(visDate).format('LL')}
                </div>
              </td>
            </tr>
            <tr>
              <td>Details</td>
              <td>
                <div>
                  <span className='header'>Lot Number:</span>
                  {lotId}
                </div>
                {
                  expire &&
                  <div>
                    <span className='header'>Expiration Date:</span>
                    {moment(expire).format('LL')}
                  </div>
                }
                <div>
                  <span className='header'>Location:</span>
                  {location}
                </div>
                <div>
                  <span className='header'>Quantity:</span>
                  {quantity}
                </div>
                {/* <div>
                  <span className='header'>Donated:</span>
                  {donated ? 'Yes' : 'No'}
                </div>
                {
                  donated &&
                  <div>
                    <span className='header'>Donated By:</span>
                    {donatedBy}
                  </div>
                } */}
              </td>
            </tr>
            <tr>
              <td>Note</td>
              <td>
                <Form.TextArea rows={3} value={newNote} onChange={(event, { value }) => setNewNote(value)} />
              </td>
            </tr>
          </tbody>
        </table>
      </Modal.Content>
      <Modal.Actions>
        <Button
          // id={COMPONENT_IDS.VACCINE_EDIT}
          content="Save Changes"
          labelPosition='right'
          icon='edit'
          onClick={() => submit()}
          color='linkedin'
        />
        {
          QRCode &&
          <Button
            content="Print QR Code"
            labelPosition='right'
            icon='qrcode'
            onClick={() => printQRCode(QRCode)}
            color='teal'
          />
        }
        <Button
          content="Delete"
          labelPosition='right'
          icon='trash alternate'
          color='red'
          onClick={() => deleteOption()}
        />
        <Button color='black' onClick={() => setOpen(false)} id={COMPONENT_IDS.VACCINE_INFO_CLOSE}>
          Close
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

// Require a document to be passed to this component.
VaccineInfoPage.propTypes = {
  info: PropTypes.object.isRequired,
  detail: PropTypes.object.isRequired,
};

export default VaccineInfoPage;
