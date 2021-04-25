import { createStore, compose, applyMiddleware,combineReducers } from 'redux'
import { createWrapper, HYDRATE } from "next-redux-wrapper";
import thunkMiddleware from 'redux-thunk' 
import generalReducer from "../store/reducers/general"
import playlistReducer from "../store/reducers/playlist"
import toastReducer from "../store/reducers/toast"
import ratingReducer from "../store/reducers/rating"
import searchReducer from "../store/reducers/search"
import sharepopupReducer from "../store/reducers/sharepopup"
import reportReducer from "../store/reducers/report"
import miniplayerReducer from "../store/reducers/miniplayer"
import audioReducer from "../store/reducers/audio"

const combinedReducer = combineReducers({
	rating:ratingReducer,
	general:generalReducer,
	playlist:playlistReducer,
	toast:toastReducer,
	search:searchReducer,
	sharepopup:sharepopupReducer,
	report:reportReducer,
	miniplayer:miniplayerReducer,
	audio:audioReducer
});

// BINDING MIDDLEWARE
const bindMiddleware = (middleware) => {
	if (process.env.NODE_ENV !== "production") {
	  const { composeWithDevTools } = require("redux-devtools-extension");
	  return composeWithDevTools(applyMiddleware(...middleware));
	}
	return applyMiddleware(...middleware);
  };

// create a makeStore function
const makeStore = context => createStore(combinedReducer,bindMiddleware([thunkMiddleware]));

// export an assembled wrapper
export const wrapper = createWrapper(makeStore, {debug: false});