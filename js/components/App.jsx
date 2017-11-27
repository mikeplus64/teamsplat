// @flow
import React from 'react';
import Grommet from 'grommet/components/App';
import Anchor from 'grommet/components/Anchor';
import Title from 'grommet/components/Title';
import Footer from 'grommet/components/Footer';
import Box from 'grommet/components/Box';
import Split from 'grommet/components/Split';
import Sidebar from 'grommet/components/Sidebar';
import Header from 'grommet/components/Header';
import Menu from 'grommet/components/Menu';
import './App.css';

export default class App extends React.PureComponent {
  props: {
    children: React$Component<>,
    main: ?React$Component<>,
    sidebar: ?React$Component<>,
  };

  content() {
    if (this.props.main) {
      return this.props.main;
    }
    if (this.props.children) { return this.props.children; }
    return (<Box pad="medium">
      <article key="home">
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/T0qagA4_eVQ"
        />
      </article>
      <Footer key="credit" primary appCentered size="small">
        <p>
          By{' '}
          <a href="mailto:mike@quasimal.com">mike</a> and{' '}
          <a href="http://www.voobly.com/profile/view/124274399">voidhawk</a>
        </p>
      </Footer>
    </Box>);
  }

  render() {
    return (
      <Grommet>
        <Split flex="right">
          <Sidebar colorIndex="grey-1-a" size="small">
            <Header pad="small" size="small">
              <Title truncate={false}>
                <span style={{ fontSize: '1.2rem' }}>
                  Teamsplatter
                </span>
              </Title>
            </Header>
            <Menu primary size="small">
              <Anchor path="/" label="Home" />
              <Anchor path="/table" label="New table" />
              <Anchor path="/tables" label="Tables" />
              {this.props.sidebar}
            </Menu>
          </Sidebar>
          <Box full>
            {this.content()}
          </Box>
        </Split>
      </Grommet>
    );
  }
}
