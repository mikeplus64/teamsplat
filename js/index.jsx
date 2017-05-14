/* @flow */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, hashHistory } from 'react-router';
import 'grommet/grommet.min.css';
import App from './components/App.jsx';
import Table from './components/Table.jsx';
import Tables from './components/Tables.jsx';
import TableControls from './components/TableControls.jsx';
import NewTable from './components/NewTable.jsx';
import connect from './store';
import api from './api';
import './fun.js';

render(connect(store =>
  <Provider store={store}>
    <Router history={hashHistory}>
      <Route path="/" component={App}>
        <Route path="tables" components={Tables} />
        <Route path="table/:name" components={{ sidebar: TableControls, main: Table }} />
        <Route path="table" component={NewTable} />
      </Route>
    </Router>
  </Provider>),
  document.getElementById('app'),
);

