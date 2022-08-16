import React, { useState } from 'react';
import { Header, Input, Button, List, Loader } from 'semantic-ui-react';
import swal from 'sweetalert';
import { useTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
// import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { defineBrandMethod, removeItMethod, updateBrandMethod } from '../../../api/ManageDropdown.methods';

/**
 * inserts the dropdown option
 */
const insertOption = (collectionName, newOption, callback) => {
  defineBrandMethod.callPromise({ collectionName, newOption })
    .then(() => {
      swal('Success', `${newOption.drugBrand} added successfully.`, 'success', { buttons: false, timer: 3000 });
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
  updateBrandMethod.callPromise({ collectionName, prev, option, instance })
    .then(count => {
      console.log(count);
      swal('Success', `${prev} updated successfully.`, 'success', { buttons: false, timer: 3000 });
    })
    .catch(error => swal('Error', error.message, 'error'));
};

const ListItem = ({ record, collectionName, name }) => {
  const [edit, setEdit] = useState(false);
  const [editOption, setEditOption] = useState(record[name]);
  const [genericName, setGenericName] = useState(record["genericName"])

  const handleEdit = () => {
    setEdit(!edit);
    setEditOption(record[name]);
    setGenericName(record["genericName"])
  };

  return (
    <List.Item className="list-item" >
      <List.Content className="brand-name">
        {
          edit ?
            <Input value={editOption} onChange={(event, { value }) => setEditOption(value)} />
            :
            <>{record[name]}</>
        }
      </List.Content>
      <List.Content>
        {
          edit ?
            <Input value={genericName} onChange={(event, { value }) => setGenericName(value)} />
            :
            <>{record["genericName"]}</>
        }
      </List.Content>
      {
        edit &&
        <List.Icon name='check' onClick={() => updateOption(collectionName, record[name], { drugBrand: editOption, genericName }, record._id)} />
      }
      <List.Icon name={edit ? 'ban': 'pencil'} onClick={handleEdit} />
      <List.Icon name='trash alternate' onClick={() => deleteOption(collectionName, record[name], record._id)} />
    </List.Item>
  );
};

const ManageDrugBrand = ({ collection, title, name }) => {
  const collectionName = collection.getCollectionName();
  const [newOption, setNewOption] = useState('');
  const [genericName, setGenericName] = useState('')
  const clearField = () => {
    setNewOption('')
    setGenericName('')
  }

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
        <Input onChange={(event, { value }) => setNewOption(value)} value={newOption} placeholder='Add new brand...' />
        <Input onChange={(event, { value }) => setGenericName(value)} value={genericName} placeholder='Add new generic...' />
        <Button content='Add' onClick={() => insertOption(collectionName, { drugBrand: newOption, genericName }, clearField)} />
      </div>
      <List divided relaxed>
        <List.Item className="list-header">
          <List.Header>Brand Name</List.Header>
          <List.Header>Generic Name</List.Header>
        </List.Item>
        {
          records.map(record => (
            <ListItem key={record._id} record={record} collectionName={collectionName} name={name} />
          ))
        }
      </List>
    </div>
  );
};

ManageDrugBrand.propTypes = {
  // collection: PropTypes.instanceOf().isRequired, 
  title: PropTypes.string.isRequired, 
  name: PropTypes.string.isRequired, 
};

export default ManageDrugBrand;
