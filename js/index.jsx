/* @flow */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, hashHistory } from 'react-router';
import '../node_modules/grommet/scss/vanilla/index.scss';

import App from './components/App.jsx';
import Editor from './components/Editor.jsx';
import Tables from './components/Tables.jsx';
import TableControls from './components/TableControls.jsx';
import NewTable from './components/NewTable.jsx';
import connect from './store';
import './fun.js';

render(connect(store =>
  <Provider store={store}>
    <Router history={hashHistory}>
      <Route path="/" component={App}>
        <Route path="tables" components={Tables} />
        <Route path="table/:name" components={{ sidebar: TableControls, main: Editor }} />
        <Route path="table" component={NewTable} />
      </Route>
    </Router>
  </Provider>),
  document.getElementById('app'),
);

