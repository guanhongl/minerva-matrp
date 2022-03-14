import React, { useState } from 'react';
import { Button, Modal, Form } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
import moment from 'moment';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { Medications } from '../../../api/medication/MedicationCollection';
import { updateMethod } from '../../../api/base/BaseCollection.methods';
import { printQRCode } from '../../utilities/Functions';

const MedInfoPage = ({ info: { _id, drug, drugType, minQuantity, unit }, detail: { lotId, brand, expire, location, quantity, donated, donatedBy, note, QRCode } }) => {
  const [open, setOpen] = useState(false);

  // useState for note field when editing notes.
  const [newNote, setNewNote] = useState(note);

  // TODO fix bug where submit re-renders
  const submit = () => {
    const collectionName = Medications.getCollectionName();
    const exists = Medications.findOne({ drug });
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
          const collectionName = Medications.getCollectionName();
          const exists = Medications.findOne({ drug });
          const { lotIds } = exists;
          const targetIndex = lotIds.findIndex((obj => obj.lotId === lotId));
          lotIds.splice(targetIndex, 1);
          const updateData = { id: _id, lotIds };
          updateMethod.callPromise({ collectionName, updateData })
            .then(() => swal('Success', `${drug} updated successfully`, 'success', { buttons: false, timer: 3000 }))
            .catch(error => swal('Error', error.message, 'error'));
        }
      });
  };

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      size='small'
      id={COMPONENT_IDS.DRUG_PAGE}
      className='info-modal'
      trigger={<Button size='mini' circular icon='info' color='linkedin' id={COMPONENT_IDS.DRUG_PAGE_BUTTON} />}
    >
      <Modal.Header>Drug Information</Modal.Header>
      <Modal.Content scrolling>
        <table>
          <tbody>
            <tr>
              <td style={{ width: '150px' }}>General Info</td>
              <td>
                <div>
                  <span className='header'>Drug:</span>
                  {drug}
                </div>
                <div>
                  <span className='header'>Drug Type(s):</span>
                  {drugType.join(', ')}
                </div>
                <div>
                  <span className='header'>Minimum Quantity:</span>
                  {minQuantity}
                </div>
                <div>
                  <span className='header'>Unit:</span>
                  {unit}
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
                <div>
                  <span className='header'>Brand:</span>
                  {brand}
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
                <div>
                  <span className='header'>Donated:</span>
                  {donated ? 'Yes' : 'No'}
                </div>
                {
                  donated &&
                  <div>
                    <span className='header'>Donated By:</span>
                    {donatedBy}
                  </div>
                }
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
          // id={COMPONENT_IDS.DRUG_EDIT}
          content="Save Changes"
          labelPosition='right'
          icon='check'
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
        <Button color='black' onClick={() => setOpen(false)} id={COMPONENT_IDS.DRUG_CLOSE}>
          Close
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

// Require info and detail to be passed to this component.
MedInfoPage.propTypes = {
  info: PropTypes.object.isRequired,
  detail: PropTypes.object.isRequired,
};

export default MedInfoPage;