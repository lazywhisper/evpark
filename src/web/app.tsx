import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import Dashboard from "./pages/Dashboard";
import ListingDetail from "./pages/ListingDetail";
import Notifications from "./pages/Notifications";
import Filters from "./pages/Filters";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/listings/:id" component={ListingDetail} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/filters" component={Filters} />
        <Route>
          <div className="p-8">404</div>
        </Route>
      </Switch>
    </Provider>
  );
}

export default App;
