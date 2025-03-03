import React, { useState } from 'react';
import { Header, Input, Button, List, Loader } from 'semantic-ui-react';
import swal from 'sweetalert';
import { useTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
// import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { defineMethod, removeItMethod, updateMethod } from '../../../api/ManageDropdown.methods';

/**
 * inserts the dropdown option
 */
const insertOption = (collectionName, newOption, callback) => {
  defineMethod.callPromise({ collectionName, newOption })
    .then(() => {
      swal('Success', `${newOption} added successfully.`, 'success', { buttons: false, timer: 3000 });
      callback();
    })
    .catch(error => swal('Error', error.message, 'error'));
};

/**
 * deletes the dropdown option
 */
const deleteOption = (collectionName, option, instance) => {
  swal({
    title: 'Are you sure?',
    text: `Do you really want to delete ${option}?`,
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
        removeItMethod.callPromise({ collectionName, option, instance })
          .then(() => {
            swal('Success', `${option} deleted successfully`, 'success', { buttons: false, timer: 3000 });
          })
          .catch(error => swal('Error', error.message, 'error'));
      }
    });
};

/**
 * updates the dropdown option
 */
const updateOption = (collectionName, prev, option, instance) => {
  updateMethod.callPromise({ collectionName, prev, option, instance })
    .then(count => {
      console.log(count);
      swal('Success', `${prev} updated successfully.`, 'success', { buttons: false, timer: 3000 });
    })
    .catch(error => swal('Error', error.message, 'error'));
};

const ListItem = ({ record, collectionName, name }) => {
  const [edit, setEdit] = useState(false);
  const [editOption, setEditOption] = useState(record[name]);

  const handleEdit = () => {
    setEdit(!edit);
    setEditOption(record[name]);
  };

  return (
    <List.Item>
      <List.Content>
        {
          edit ?
            <Input value={editOption} onChange={(event, { value }) => setEditOption(value)} />
            :
            <>{record[name]}</>
        }
      </List.Content>
      {
        edit &&
        <List.Icon name='check' onClick={() => updateOption(collectionName, record[name], editOption, record._id)} />
      }
      <List.Icon name={edit ? 'ban': 'pencil'} onClick={handleEdit} />
      <List.Icon name='trash alternate' onClick={() => deleteOption(collectionName, record[name], record._id)} />
    </List.Item>
  );
};

const ManageSingle = ({ collection, title, name }) => {
  const collectionName = collection.getCollectionName();
  const [newOption, setNewOption] = useState('');
  const clearField = () => setNewOption('');

  const { records, isLoading } = useTracker(() => {
    const handle = collection.subscribe();

    if (!handle.ready()) {
      return { records: [], isLoading: true };
    }

    const records = collection.find({}, { sort: { [name]: 1 } }).fetch();
    return { records, isLoading: false };
  });

  if (isLoading) {
    return (<Loader active>Getting data</Loader>);
  }
  return (
    <div className='manage-tab'>
      <Header as='h2'>{`Manage ${title} (${records.length})`}</Header>
      <div className='controls'>
        <Input onChange={(event, { value }) => setNewOption(value)} value={newOption} placeholder='Add new...' />
        <Button content='Add' onClick={() => insertOption(collectionName, newOption, clearField)} />
      </div>
      <List divided relaxed>
        {
          records.map(record => (
            <ListItem key={record._id} record={record} collectionName={collectionName} name={name} />
          ))
        }
      </List>
    </div>
  );
};

ManageSingle.propTypes = {
  // collection: PropTypes.instanceOf().isRequired, 
  title: PropTypes.string.isRequired, 
  name: PropTypes.string.isRequired, 
};

export default ManageSingle;
