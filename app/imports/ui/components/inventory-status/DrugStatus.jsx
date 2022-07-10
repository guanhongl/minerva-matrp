import React, { useState, useEffect } from 'react';
import { Header, Table, Divider, Dropdown, Pagination, Input, Loader, Icon, Popup, Tab, Message, Checkbox } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import moment from 'moment';
import { ZipZap } from 'meteor/udondan:zipzap';
import { Drugs } from '../../../api/drug/DrugCollection';
import { DrugTypes } from '../../../api/drugType/DrugTypeCollection';
import { Units } from '../../../api/unit/UnitCollection';
import { DrugBrands } from '../../../api/drugBrand/DrugBrandCollection';
import { Locations } from '../../../api/location/LocationCollection';
import { PAGE_IDS } from '../../utilities/PageIDs';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import DrugStatusRow from './DrugStatusRow';
import { fetchCounts, fetchField, getOptions } from '../../utilities/Functions';
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

const currentDate = moment();

// replace " " with "-" and make lowercase
const formatQuery = (query) => {
  return query.replace(/\s+/g, "-").toLowerCase();
};

// Render the form.
const DrugStatus = ({ ready, drugs, drugTypes, units, brands, locations, countL, countN }) => {
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  useEffect(() => {
    setFilteredDrugs(drugs);
  }, [drugs]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const [typeFilter, setTypeFilter] = useState(0);
  const [brandFilter, setBrandFilter] = useState(0);
  const [locationFilter, setLocationFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState(0);
  const [expireFilter, setExpireFilter] = useState(false);
  const [maxRecords, setMaxRecords] = useState(25);
  const [visible, setVisible] = useState(JSON.parse(window.localStorage.getItem("visible")) ?? true);
  const [loading, setLoading] = useState(false); // download loader

  // handles filtering
  useEffect(() => {
    let filter = cloneDeep(drugs);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filter = filter.filter(o => {
        // short circuit here
        if (o.drug.toLowerCase().includes(query)) {
          return true;
        }
        o.lotIds = o.lotIds.filter(lot => lot.lotId.toLowerCase().includes(query)); // nested filter
        if (o.lotIds.length > 0) {
          return true;
        }
        // replace with date input filter
        // o.lotIds = o.lotIds.filter(lot => ( lot.expire && lot.expire.includes(query) )) // nested filter
        // if (o.lotIds.length > 0) {
        //   return true;
        // }
      });
    }
    if (typeFilter) {
      filter = filter.filter((o) => o.drugType.includes(typeFilter));
    }
    if (brandFilter) {
      filter = filter.filter(o => {
        o.lotIds = o.lotIds.filter(lot => lot.brand === brandFilter); // nested filter
        return o.lotIds.length > 0;
      });
    }
    if (locationFilter) {
      filter = filter.filter(o => {
        o.lotIds = o.lotIds.filter(lot => lot.location === locationFilter); // nested filter
        return o.lotIds.length > 0;
      });
    }
    if (statusFilter) {
      filter = filter.filter((drug) => {
        if (statusFilter === 'In Stock') {
          return drug.sum >= drug.minQuantity;
        }
        if (statusFilter === 'Low Stock') {
          return (drug.sum > 0 && drug.sum < drug.minQuantity);
        }
        if (statusFilter === 'Out of Stock') {
          return drug.sum === 0;
        }
        return true;
      });
    }
    if (expireFilter) {
      filter = filter.filter(o => {
        o.lotIds = o.lotIds.filter(lot => lot.isExpired);
        return o.lotIds.length > 0;
      });
    }
    setFilteredDrugs(filter);
  }, [searchQuery, typeFilter, brandFilter, locationFilter, statusFilter, expireFilter]);

  const handleSearch = (event, { value }) => setSearchQuery(value);
  const handleTypeFilter = (event, { value }) => setTypeFilter(value);
  const handleBrandFilter = (event, { value }) => setBrandFilter(value);
  const handleLocationFilter = (event, { value }) => setLocationFilter(value);
  const handleStatusFilter = (event, { value }) => setStatusFilter(value);
  const handleExpireFilter = (event, { checked }) => setExpireFilter(checked);
  const handleRecordLimit = (event, { value }) => setMaxRecords(value);

  const handleDismiss = () => {
    setVisible(!visible);
    window.localStorage.setItem("visible", JSON.stringify(!visible));
  };

  // download DB w/ filter
  const download = () => {
    setLoading(true);
    const _ids = _.pluck(
      _.pluck(filteredDrugs, "lotIds").flat(),
      "_id",
    );
    downloadDatabaseMethod.callPromise({ db: "drugs", _ids })
      .then(csv => {
        const zip = new ZipZap();
        const dir = 'minerva-db';
        // query, type, brand, location, status
        let filter = "";
        if (searchQuery) {
          filter += `query=${formatQuery(searchQuery)}&`;
        }
        if (typeFilter) {
          filter += `type=${formatQuery(typeFilter)}&`;
        }
        if (brandFilter) {
          filter += `brand=${formatQuery(brandFilter)}&`;
        }
        if (locationFilter) {
          filter += `location=${formatQuery(locationFilter)}&`;
        }
        if (statusFilter) {
          filter += `status=${formatQuery(statusFilter)}&`;
        }
        if (expireFilter) {
          filter += `expire=true&`;
        }
        // append "-" and remove the last char
        if (filter) {
          filter = `-${filter.slice(0, -1)}`;
        }
        const fileName = `${dir}/${moment().format("YYYY-MM-DD")}-drugs${filter}.csv`;
        zip.file(fileName, csv);
        zip.saveAs(`${dir}.zip`);
      })
      .catch(error => swal("Error", error.message, "error"))
      .finally(() => setLoading(false));
  };

  if (ready) {
    return (
      <Tab.Pane id={PAGE_IDS.MED_STATUS} className='status-tab'>
        <Header as="h2">
          <Header.Content>
              Drug Inventory
            <Header.Subheader>
              Use the search and dropdown filters to find a specific drug.
            </Header.Subheader>
          </Header.Content>
        </Header>
        <div className='controls'>
          <Popup
            trigger={<Input placeholder='Filter by drug name...' icon='search'
              onChange={handleSearch} value={searchQuery} id={COMPONENT_IDS.STATUS_FILTER}/>}
            content='This allows you to filter drugs by name, lot, and expiration (YYYY-MM-DD).'
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

        <div className='filters'>
          <span>
            <span>Type:</span>
            <Dropdown inline options={getFilters(drugTypes)} search
              onChange={handleTypeFilter} value={typeFilter} id={COMPONENT_IDS.MEDICATION_TYPE}/>
          </span>
          <span>
            <span>Brand:</span>
            <Dropdown inline options={getFilters(brands)} search
              onChange={handleBrandFilter} value={brandFilter} id={COMPONENT_IDS.MEDICATION_BRAND}/>
          </span>
          <span>
            <span>Location:</span>
            <Dropdown inline options={getFilters(locations)} search
              onChange={handleLocationFilter} value={locationFilter} id={COMPONENT_IDS.MEDICATION_LOCATION}/>
          </span>
          <span>
            <span>Status:</span>
            <Dropdown inline options={statusOptions} 
              onChange={handleStatusFilter} value={statusFilter} id={COMPONENT_IDS.INVENTORY_STATUS}/>
          </span>
        </div>

        <Checkbox toggle label="Expired" checked={expireFilter} onChange={handleExpireFilter} />
        
        <Divider/>

        {
          (countL + countN) &&
          (
            visible ?
              <Message warning
                onDismiss={handleDismiss}
                header="Some drugs are low on stock!"
                content={`${countL} drugs are low on stock and ${countN} drugs are out of stock.`}
              />
              :
              <div className='warning-div' onClick={handleDismiss}>Expand warning message</div>
          )
        }

        <div>
            Records per page: {' '}
          <Dropdown inline options={recordOptions}
            onChange={handleRecordLimit} value={maxRecords} id={COMPONENT_IDS.NUM_OF_RECORDS}/>
          <span>
            {`Total count: ${filteredDrugs.length} drugs, 
            ${filteredDrugs.reduce((p, c) => p + c.lotIds.length, 0)} lots`}
          </span>
        </div>

        <div className='table-wrapper'>
          <Table selectable color='blue' unstackable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell/>
                <Table.HeaderCell>Drug</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Total Quantity</Table.HeaderCell>
                <Table.HeaderCell>Unit</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell/>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {
                filteredDrugs.slice((pageNo - 1) * maxRecords, pageNo * maxRecords)
                  .map(med => <DrugStatusRow key={med._id} med={med} drugTypes={drugTypes} locations={locations} units={units} brands={brands} />)
              }
            </Table.Body>

            <Table.Footer>
              <Table.Row>
                <Table.HeaderCell colSpan="7">
                  <Pagination
                    totalPages={Math.ceil(filteredDrugs.length / maxRecords)}
                    activePage={pageNo}
                    onPageChange={(event, data) => {
                      setPageNo(data.activePage);
                      window.scrollTo(0, 0);
                    }}
                    ellipsisItem={{ content: <Icon name='ellipsis horizontal'/>, icon: true }}
                    firstItem={{ content: <Icon name='angle double left'/>, icon: true }}
                    lastItem={{ content: <Icon name='angle double right'/>, icon: true }}
                    prevItem={{ content: <Icon name='angle left'/>, icon: true }}
                    nextItem={{ content: <Icon name='angle right'/>, icon: true }}
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

DrugStatus.propTypes = {
  drugs: PropTypes.array.isRequired,
  drugTypes: PropTypes.array.isRequired,
  units: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
  countL: PropTypes.number.isRequired,
  countN: PropTypes.number.isRequired,
};

// withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
export default withTracker(() => {
  const drugSub = Drugs.subscribeDrug();
  const drugTypeSub = DrugTypes.subscribe();
  const unitSub = Units.subscribe();
  const drugBrandSub = DrugBrands.subscribe();
  const locationSub = Locations.subscribe();
  // Determine if the subscription is ready
  const ready = drugSub.ready() && drugTypeSub.ready() && unitSub.ready() && drugBrandSub.ready() && locationSub.ready();
  // Get the Drug documents and sort them by name.
  const drugs = Drugs.find({}, { sort: { drug: 1 } }).fetch();
  const drugTypes = fetchField(DrugTypes, "drugType");
  const units = fetchField(Units, "unit");
  const brands = fetchField(DrugBrands, "drugBrand");
  const locations = fetchField(Locations, "location");
  // add is expired and total quantity to drugs
  drugs.forEach(doc => {
    let sum = 0;
    doc.lotIds.forEach(o => {
      const expire = o.expire;
      const isExpired = expire ? (currentDate > moment(expire)) : false;
      if (!isExpired)
        sum += o.quantity;
      o.isExpired = isExpired;
    });
    doc.sum = sum;
  });
  const [countL, countN] = fetchCounts(drugs);
  return {
    drugs,
    drugTypes,
    units,
    brands,
    locations,
    ready,
    countL,
    countN,
  };
})(DrugStatus);
