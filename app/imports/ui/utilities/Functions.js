import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { _ } from 'meteor/underscore';

export function fetchField(collection, field) {
  return _.pluck(
    collection.find({}, { sort: { [field]: 1 } }).fetch(),
    field,
  );
}

// TODO: fix
export function distinct(field, collection, selector = {}) {
  const fields = _.pluck(
    collection.find(selector, { sort: { [field]: 1 }, fields: { [field]: 1 } }).fetch(),
    field,
  );

  return _.uniq(
    field === 'drugType' ? fields.flat() : fields,
    true,
  );
}

export function nestedDistinct(field, collection, selector = {}) {
  const fields = _.pluck(
    _.pluck(collection.find(selector, { fields: { [`lotIds.${field}`]: 1 } }).fetch(), 'lotIds').flat(),
    field,
  ).sort();

  return _.uniq(fields, true);
}

/** convert array to dropdown options */
export function getOptions(arr) {
  return arr.map(name => ({ key: name, text: name, value: name }));
}

// A custom hook that builds on useLocation to parse the query string for you.
export function useQuery() {
  const { search } = useLocation();

  return useMemo(() => new URLSearchParams(search), [search]);
}

// see https://stackoverflow.com/questions/2909033/using-javascript-to-print-images
export function printQRCode(png) {
  popup = window.open();
  popup.document.open();
  popup.document.write(`<img src="${png}">`);
  popup.document.close();
  popup.print();
}