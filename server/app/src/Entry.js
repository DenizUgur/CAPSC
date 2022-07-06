import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import Demo from "./Demo";
import Client from "./Client";

export default function Entry() {
	return (
		<Router>
			<Routes>
				<Route exact path="/" element={<Demo />} />
				<Route exact path="/client" element={<Client />} />
				<Route path="/*" element={<Navigate to="/" />} />
			</Routes>
		</Router>
	);
}
