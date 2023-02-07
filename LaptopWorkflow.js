// Example for a ServiceNow Platform Flow Designer Flow-as-code to automate new hire laptop purchase, assignment, and delivery business processes.
// Includes conditional logic exceptions for Japanese independent contractors who are provided cash to purchase their own laptops. 
// Version currently 1.1.0 to reflect changes to original Flow with the updated conditional logic. 

const LaptopWorkflow = atf.defineFlow({
    name: "Laptop Workflow",
    description: "Automatically purchase, assign, and deliver a new laptop to a new employee",
    version: "1.1.0",
    triggers: [
        {
            name: "New Employee Hire",
            description: "Triggered when a new employee is added to the system",
            type: "Record",
            table: "sys_user",
            when: "after",
            filter: "state=active"
        }
    ],
    stages: [
        {
            name: "Start the flow",
            description: "Start the flow to purchase, assign, and deliver a new laptop to a new employee",
            version: "1.0.0",
            script: (current: GlideRecord) => {
                // Start the flow
                var employee = new GlideRecord('sys_user');
                employee.get(current.requested_for);
                var flowState = "started";
                gs.info("Flow has been started for employee "+employee.name+". State: "+flowState);
            }
        },
        {
            name: "Purchase Laptop",
            description: "Purchase a new laptop for the employee",
            version: "1.1.0",
            script: (current: GlideRecord) => {
                // Code to purchase laptop
                var employee = new GlideRecord('sys_user');
                employee.get(current.requested_for);
                if (employee.location.name == "Japan") {
                    flowState = "cash_provided";
                    gs.info("Cash has been provided to employee "+employee.name+" in Japan to purchase their own laptop. State: "+flowState);
                } else {
                    var laptop = new GlideRecord('alm_asset');
                    laptop.initialize();
                    laptop.name = 'Laptop for '+employee.name;
                    laptop.asset_tag = 'LP-'+gs.generateGUID().substring(0, 8);
                    laptop.model = 'Dell Latitude';
                    laptop.status = 'Purchased';
                    laptop.insert();
                    flowState = "purchased";
                    gs.info("Laptop has been purchased for employee "+employee.name+". State: "+flowState);
                }
            }
        },
        {
            name: "Assign Laptop",
            description: "Assign the purchased laptop to the employee",
            version: "1.1.0",
            script: (current: GlideRecord) => {
                // Code to assign laptop
                // Use the ServiceNow IT Asset Management API to assign the laptop to the employee
                // Update the state of the flow to "assigned"
                if (flowState != "cash_provided") {
                    var laptop = new GlideRecord('alm_asset');
                    laptop.get(laptop.sys_id);
                    laptop.assigned_to = employee.sys_id;
                    laptop.update();
                    flowState = "assigned";
                    gs.info("Laptop has been assigned to employee "+employee.name+". State: "+flowState);
                } else {
                    gs.info("Laptop has not been assigned as employee "+employee.name+" has been provided with cash to purchase their own laptop. State: "+flowState);
                }
            }
        },
        {
            name: "Deliver Laptop",
            description: "Deliver the assigned laptop to the employee",
            version: "1.1.0",
            script: (current: GlideRecord) => {
                // Code to deliver laptop
                // Use the ServiceNow IT Asset Management API to mark the laptop as delivered
                // Update the state of the flow to "delivered"
                if (flowState != "cash_provided") {
                    var laptop = new GlideRecord('alm_asset');
                    laptop.get(laptop.sys_id);
                    laptop.status = 'Delivered';
                    laptop.update();
                    flowState = "delivered";
                    gs.info("Laptop has been delivered to employee "+employee.name+". State: "+flowState);
                } else {
                    gs.info("Laptop has not been delivered as employee "+employee.name+" has been provided with cash to purchase their own laptop. State: "+flowState);
                }
            }
        }
    ]
});
