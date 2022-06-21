import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { _ } from 'meteor/underscore';

export function fetchField(collection, field, selector = {}) {
  return _.pluck(
    collection.find(selector, { sort: { [field]: 1 } }).fetch(),
    field,
  );
};

export function fetchLots(collection) {
  return _.pluck(
    _.pluck(collection.find().fetch(), "lotIds").flat(),
    "lotId",
  ).sort();
};

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