import React, { useState, useEffect } from 'react';
import { Header, Table, Divider, Dropdown, Pagination, Message, Input, Loader, Icon, Popup, Tab } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import moment from 'moment';
import { ZipZap } from 'meteor/udondan:zipzap';
import { Locations } from '../../../api/location/LocationCollection';
import { PAGE_IDS } from '../../utilities/PageIDs';
import { fetchCounts, fetchField, getOptions, getLocations } from '../../utilities/Functions';
import { Supplys, supplyTypes } from '../../../api/supply/SupplyCollection';
import SupplyStatusRow from './SupplyStatusRow';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { cloneDeep } from 'lodash';
import { downloadDatabaseMethod } from '../../../api/ManageDatabase.methods';

// convert array to dropdown options
const getFilters = (arr) => [{ key: 'All', value: 0, text: 'All' }, ...getOptions(arr)];

const recordOptions = [
  // { key: 0, value: 10, text: '10' },
  { key: 1, value: 25, text: '25' },
  { key: 2, value: 50, text: '50' },
  { key: 3, value: 100, text: '100' },
];

const statusOptions = [
  { key: 'All', value: 0, text: 'All' },
  { key: 1, value: 'In Stock', text: 'In Stock' },
  { key: 2, value: 'Low Stock', text: 'Low Stock' },
  { key: 3, value: 'Out of Stock', text: 'Out of stock' },
];

// replace " " with "-" and make lowercase
const formatQuery = (query) => {
  return query.replace(/\s+/g, "-").toLowerCase();
};

// Render the form.
const SupplyStatus = ({ ready, supplies, locations, countL, countN }) => {
  const [filteredSupplies, setFilteredSupplies] = useState([]);
  useEffect(() => {
    setFilteredSupplies(supplies);
  }, [supplies]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const [typeFilter, setTypeFilter] = useState(0);
  const [locationFilter, setLocationFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState(0);
  const [maxRecords, setMaxRecords] = useState(25);
  const [visible, setVisible] = useState(JSON.parse(window.localStorage.getItem("visible")) ?? true);
  const [loading, setLoading] = useState(false); // download loader

  // handles filtering
  useEffect(() => {
    let filter = cloneDeep(supplies); // deep clone supplies
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filter = filter.filter(({ supply }) => (
        supply.toLowerCase().includes(query)
      ));
    }
    if (typeFilter) {
      filter = filter.filter(o => o.supplyType === typeFilter);
    }
    if (locationFilter) {
      filter = filter.filter(o => {
        o.stock = o.stock.filter(lot => lot.location.includes(locationFilter)); // nested filter
        return o.stock.length > 0;
      });
    }
    if (statusFilter) {
      filter = filter.filter((supply) => {
        if (statusFilter === 'In Stock') {
          if (!supply.isDiscrete) {
            return true
          }

          return supply.sum >= supply.minQuantity;
        }
        if (statusFilter === 'Low Stock') {
          return (supply.sum > 0 && supply.sum < supply.minQuantity);
        }
        if (statusFilter === 'Out of Stock') {
          return supply.sum === 0;
        }
        return true;
      });
    }
    setFilteredSupplies(filter);
  }, [searchQuery, typeFilter, locationFilter, statusFilter]);

  const handleSearch = (event, { value }) => setSearchQuery(value);
  const handleTypeFilter = (event, { value }) => setTypeFilter(value);
  const handleLocationFilter = (event, { value }) => setLocationFilter(value);
  const handleStatusFilter = (event, { value }) => setStatusFilter(value);
  const handleRecordLimit = (event, { value }) => setMaxRecords(value);

  const handleDismiss = () => {
    setVisible(!visible);
    window.localStorage.setItem("visible", JSON.stringify(!visible));
  };

  // download DB w/ filter
  const download = () => {
    setLoading(true);
    const _ids = _.pluck(
      _.pluck(filteredSupplies, "stock").flat(),
      "_id",
    );
    downloadDatabaseMethod.callPromise({ db: "supplies", _ids })
      .then(csv => {
        const zip = new ZipZap();
        const dir = 'minerva-db';
        // query, location, status
        let filter = "";
        if (searchQuery) {
          filter += `query=${formatQuery(searchQuery)}&`;
        }
        if (typeFilter) {
          filter += `type=${formatQuery(typeFilter)}&`;
        }
        if (locationFilter) {
          filter += `location=${formatQuery(locationFilter)}&`;
        }
        if (statusFilter) {
          filter += `status=${formatQuery(statusFilter)}&`;
        }
        // append "-" and remove the last char
        if (filter) {
          filter = `-${filter.slice(0, -1)}`;
        }
        const fileName = `${dir}/${moment().format("YYYY-MM-DD")}-supplies${filter}.csv`;
        zip.file(fileName, csv);
        zip.saveAs(`${dir}.zip`);
      })
      .catch(error => swal("Error", error.message, "error"))
      .finally(() => setLoading(false));
  };

  if (ready) {
    return (
      <Tab.Pane id={PAGE_IDS.SUPPLY_STATUS} className='status-tab'>
        <Header as="h2">
          <Header.Content>
            Supply Inventory
            <Header.Subheader>
              Use the search and dropdown filters to find a specific supply.
            </Header.Subheader>
          </Header.Content>
        </Header>
        <div className='controls'>
          <Popup
            trigger={<Input placeholder='Filter by supply name...' icon='search'
              onChange={handleSearch} value={searchQuery} id={COMPONENT_IDS.SUPPLY_FILTER} />}
            content='This allows you to filter supplies by name.'
            inverted
          />
          {
            loading ? 
              <Loader inline active />
              :
              <span onClick={download}>
                <Icon name="download" />
                Download
                <Icon name="file excel" />
              </span>
          }
        </div>

        <div className='filters supply'>
          <span>
            <span>Type:</span>
            <Dropdown inline options={getFilters(supplyTypes)} 
              onChange={handleTypeFilter} value={typeFilter} />
          </span>
          <span>
            <span>Location:</span>
            <Dropdown inline options={[{ key: 'All', value: 0, text: 'All' }, ...getLocations(locations)]} search
              onChange={handleLocationFilter} value={locationFilter} id={COMPONENT_IDS.SUPPLY_LOCATION}/>
          </span>
          <span>
            <span>Status:</span>
            <Dropdown inline options={statusOptions} 
              onChange={handleStatusFilter} value={statusFilter} id={COMPONENT_IDS.SUPPLY_INVENTORY}/>
          </span>
        </div>

        <Divider/>

        {
          (countL + countN) &&
          (
            visible ?
              <Message warning
                onDismiss={handleDismiss}
                header="Some supplies are low on stock!"
                content={`${countL} supplies are low on stock and ${countN} supplies are out of stock.`}
              />
              :
              <div className='warning-div' onClick={handleDismiss}>Expand warning message</div>
          )
        }

        <div>
          Records per page: {' '}
          <Dropdown inline options={recordOptions}
            onChange={handleRecordLimit} value={maxRecords}/>
          <span>
            {`Total count: ${filteredSupplies.length} supplies, 
            ${filteredSupplies.reduce((p, c) => p + c.stock.length, 0)} lots`}
          </span>
        </div>

        <div className='table-wrapper'>
          <Table selectable color='blue' unstackable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell />
                <Table.HeaderCell>Supply</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Total Quantity</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {
                filteredSupplies.slice((pageNo - 1) * maxRecords, pageNo * maxRecords)
                  .map(supply => <SupplyStatusRow key={supply._id} supply={supply} supplyTypes={supplyTypes} locations={locations} />)
              }
            </Table.Body>

            <Table.Footer>
              <Table.Row>
                <Table.HeaderCell colSpan="6">
                  <Pagination
                    totalPages={Math.ceil(filteredSupplies.length / maxRecords)}
                    activePage={pageNo}
                    onPageChange={(event, data) => {
                      setPageNo(data.activePage);
                      window.scrollTo(0, 0);
                    }}
                    ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
                    firstItem={{ content: <Icon name='angle double left' />, icon: true }}
                    lastItem={{ content: <Icon name='angle double right' />, icon: true }}
                    prevItem={{ content: <Icon name='angle left' />, icon: true }}
                    nextItem={{ content: <Icon name='angle right' />, icon: true }}
                  />
                </Table.HeaderCell>
              </Table.Row>
            </Table.Footer>
          </Table>
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

SupplyStatus.propTypes = {
  supplies: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
  countL: PropTypes.number.isRequired,
  countN: PropTypes.number.isRequired,
};

// withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
export default withTracker(() => {
  const supplySub = Supplys.subscribeSupply();
  const locationSub = Locations.subscribe();
  // Determine if the subscription is ready
  const ready = supplySub.ready() && locationSub.ready();
  // Get the Supply documents and sort them by name.
  const supplies = Supplys.find({}, { sort: { supply: 1 } }).fetch();
  const locations = Locations.find({}, { sort: { location: 1 } }).fetch();
  // add total quantity to supplies
  supplies.forEach(doc => {
    doc.sum = doc.stock.reduce((p, c) => p + c.quantity, 0);
  });
  const [countL, countN] = fetchCounts(supplies);
  return {
    supplies,
    locations,
    ready,
    countL,
    countN,
  };
})(SupplyStatus);
