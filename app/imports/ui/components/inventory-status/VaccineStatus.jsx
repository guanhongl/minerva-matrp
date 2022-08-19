import React, { useState, useEffect } from 'react';
import { Header, Table, Divider, Dropdown, Pagination, Message, Input, Loader, Icon, Popup, Tab, Checkbox } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import moment from 'moment';
import { ZipZap } from 'meteor/udondan:zipzap';
import { Vaccines } from '../../../api/vaccine/VaccineCollection';
import { VaccineBrands } from '../../../api/vaccineBrand/VaccineBrandCollection';
import { Locations } from '../../../api/location/LocationCollection';
import { PAGE_IDS } from '../../utilities/PageIDs';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import VaccineStatusRow from './VaccineStatusRow';
import { fetchCounts, fetchField, getOptions, getLocations } from '../../utilities/Functions';
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
const VaccineStatus = ({ ready, vaccines, brands, locations, countL, countN }) => {
  const [filteredVaccines, setFilteredVaccines] = useState([]);
  useEffect(() => {
    setFilteredVaccines(vaccines);
  }, [vaccines]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const [brandFilter, setBrandFilter] = useState(0);
  const [locationFilter, setLocationFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState(0);
  const [expireFilter, setExpireFilter] = useState(false);
  const [maxRecords, setMaxRecords] = useState(25);
  const [visible, setVisible] = useState(JSON.parse(window.localStorage.getItem("visible")) ?? true);
  const [loading, setLoading] = useState(false); // download loader

  // handles filtering
  useEffect(() => {
    let filter = cloneDeep(vaccines);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filter = filter.filter(o => {
        // short circuit here
        if (o.vaccine.toLowerCase().includes(query)) {
          return true;
        }
        o.lotIds = o.lotIds.filter(lot => lot.lotId.toLowerCase().includes(query)); // nested filter
        if (o.lotIds.length > 0) {
          return true;
        }
      });
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
      filter = filter.filter((vaccine) => {
        if (statusFilter === 'In Stock') {
          return vaccine.sum >= vaccine.minQuantity;
        }
        if (statusFilter === 'Low Stock') {
          return (vaccine.sum > 0 && vaccine.sum < vaccine.minQuantity);
        }
        if (statusFilter === 'Out of Stock') {
          return vaccine.sum === 0;
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
    setFilteredVaccines(filter);
  }, [searchQuery, brandFilter, locationFilter, statusFilter, expireFilter]);

  const handleSearch = (event, { value }) => setSearchQuery(value);
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
      _.pluck(filteredVaccines, "lotIds").flat(),
      "_id",
    );
    downloadDatabaseMethod.callPromise({ db: "vaccines", _ids })
      .then(csv => {
        const zip = new ZipZap();
        const dir = 'minerva-db';
        // query, brand, location, status
        let filter = "";
        if (searchQuery) {
          filter += `query=${formatQuery(searchQuery)}&`;
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
        const fileName = `${dir}/${moment().format("YYYY-MM-DD")}-vaccines${filter}.csv`;
        zip.file(fileName, csv);
        zip.saveAs(`${dir}.zip`);
      })
      .catch(error => swal("Error", error.message, "error"))
      .finally(() => setLoading(false));
  };

  if (ready) {
    return (
      <Tab.Pane id={PAGE_IDS.VACCINE_STATUS} className='status-tab'>
        <Header as="h2">
          <Header.Content>
            Vaccine Inventory
            <Header.Subheader>
              Use the search and dropdown filters to find a specific vaccine.
            </Header.Subheader>
          </Header.Content>
        </Header>
        <div className='controls'>
          <Popup
            trigger={<Input placeholder='Filter by vaccine name...' icon='search'
              onChange={handleSearch} value={searchQuery} id={COMPONENT_IDS.VACCINE_FILTER} />}
            content='This allows you to filter vaccines by name, lot, and expiration (YYYY-MM-DD).'
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

        <div className='filters vaccine'>
          <span>
            <span>Brand:</span>
            <Dropdown inline options={getFilters(brands)} search
              onChange={handleBrandFilter} value={brandFilter} id={COMPONENT_IDS.VACCINE_BRAND}/>
          </span>
          <span>
            <span>Location:</span>
            <Dropdown inline options={[{ key: 'All', value: 0, text: 'All' }, ...getLocations(locations)]} search
              onChange={handleLocationFilter} value={locationFilter} id={COMPONENT_IDS.MEDICATION_LOCATION} />
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
                header="Some vaccines are low on stock!"
                content={`${countL} vaccines are low on stock and ${countN} vaccines are out of stock.`}
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
            {`Total count: ${filteredVaccines.length} vaccines, 
            ${filteredVaccines.reduce((p, c) => p + c.lotIds.length, 0)} lots`}
          </span>
        </div>

        <div className='table-wrapper'>
          <Table selectable color='blue' unstackable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell />
                <Table.HeaderCell>Vaccine</Table.HeaderCell>
                <Table.HeaderCell>Total Quantity</Table.HeaderCell>
                <Table.HeaderCell>VIS Date</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {
                filteredVaccines.slice((pageNo - 1) * maxRecords, pageNo * maxRecords)
                  .map(vaccine => <VaccineStatusRow key={vaccine._id} vaccine={vaccine} locations={locations} brands={brands} />)
              }
            </Table.Body>

            <Table.Footer>
              <Table.Row>
                <Table.HeaderCell colSpan="7">
                  <Pagination
                    totalPages={Math.ceil(filteredVaccines.length / maxRecords)}
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

VaccineStatus.propTypes = {
  vaccines: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
  countL: PropTypes.number.isRequired,
  countN: PropTypes.number.isRequired,
};

// withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
export default withTracker(() => {
  const vaccineSub = Vaccines.subscribeVaccine();
  const vaccineBrandSub = VaccineBrands.subscribe();
  const locationSub = Locations.subscribe();
  // Determine if the subscription is ready
  const ready = vaccineSub.ready() && vaccineBrandSub.ready() && locationSub.ready();
  // Get the Vaccination documents and sort them by name.
  const vaccines = Vaccines.find({}, { sort: { vaccine: 1 } }).fetch();
  const brands = fetchField(VaccineBrands, "vaccineBrand");
  const locations = Locations.find({}, { sort: { location: 1 } }).fetch();
  // add is expired and total quantity to vaccines
  vaccines.forEach(doc => {
    // doc.sum = doc.lotIds.reduce((p, c) => p + c.quantity, 0);
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
  const [countL, countN] = fetchCounts(vaccines);
  return {
    vaccines,
    brands,
    locations,
    ready,
    countL,
    countN,
  };
})(VaccineStatus);
