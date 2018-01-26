import _ from 'lodash';
import update from 'immutability-helper';
import initialState from './initialState';
import { reducer as fetchProjectData } from './fetchProjectData';
import { reducer as fetchFileContent } from './fetchFileContent';
import { reducer as showDemoAlertReducer } from './showDemoAlert';
import { reducer as hideDemoAlertReducer } from './hideDemoAlert';
import { reducer as saveFileReducer } from './saveFile';
import { reducer as closeTabReducer } from './closeTab';
import { reducer as moveTabReducer } from './moveTab';

const reducers = [
  fetchProjectData,
  fetchFileContent,
  showDemoAlertReducer,
  hideDemoAlertReducer,
  saveFileReducer,
  closeTabReducer,
  moveTabReducer,
];

export default function reducer(state = initialState, action) {
  let newState;
  switch (action.type) {
    // Put global reducers here
    case 'PROJECT_FILE_CHANGED':
      newState = {
        ...state,
        projectDataNeedReload: true,
      };
      break;

    case '@@router/LOCATION_CHANGE': {
      // Open tab or switch tab type while url changes.
      const { pathname } = action.payload;
      const arr = _.compact(pathname.split('/')).map(decodeURIComponent);
      // const { elementById } = state;
      let { openTabs, historyTabs } = state;
      // let tabItem = null;
      let key, type, name, icon; // eslint-disable-line

      if (arr.length === 0) {
        key = '#home';
        type = 'home';
        name = 'Home';
        icon = 'home';
      } else if (arr[1] === 'routes') {
        key = `${arr[0]}/routes`;
        type = 'routes';
        name = _.capitalize(arr[0]);
        icon = 'share-alt';
      } else if (arr[0] === 'element') {
        key = arr[1];
        const ele = state.elementById[key];
        if (!ele) {
          newState = state; // Should only happens when after refreshing the page when project data is not fetched.
          break;
        }
        type = 'element';
        name = ele.name;
        icon = {
          component: 'appstore-o',
          action: 'notification',
          misc: 'file',
        }[ele.type] || 'file';
      } else {
        // No tabs for other pages like '/blank'
        newState = state;
        break;
      }

      const foundTab = _.find(openTabs, { key });
      if (!foundTab) {
        const tabItem = { key, type, name, icon };
        if (type === 'element') {
          tabItem.subTab = arr[2] || '';
        }
        openTabs = [...openTabs, tabItem];
        historyTabs = [key, ...historyTabs];
      } else {
        // Tab has been open, move it to top of history
        historyTabs = [key, ..._.without(historyTabs, key)];

        if (type === 'element') {
          const subTab = arr[2] || '';
          // Check sub tab change for element page
          if (foundTab.subTab !== subTab) {
            // Tab type is changed.
            const index = _.findIndex(openTabs, { key });
            openTabs = update(openTabs, {
              [index]: { subTab: { $set: subTab } }
            });
          }
        }
      }
      newState = { ...state, openTabs, historyTabs };
      break;
    }
    default:
      newState = state;
      break;
  }
  return reducers.reduce((s, r) => r(s, action), newState);
}