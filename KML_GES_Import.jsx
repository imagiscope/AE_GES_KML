{	
	// This script file will open a KML file and create a route path with Google Earth Studio project created with
	// with the Google Earth Studio .jsx file.
	// Note: 1) there is no elevation data contain in the file, all points are on the same 3D plane. 2) the KML route
	// is limited to about 30km area (limitation of After Effects).

    	// Developed by: Rob Jolly, Imagiscope
	// Videos:	https://www.youtube.com/Imagiscope
	//		https://www.youtube.com/c/ImagiscopeTech

	// This script is provided free to use. Commercial benefit is prohibited.

    function doDrawKmlPath(thisObj){
        SelectedFile = File.openDialog("open file","KML:*.kml",false)
        if (SelectedFile){
            kmlFile = new File(SelectedFile);
            kmlFile.open("r");
            var xString = kmlFile.read();
            xString = xString.replace(/<kml[^>]*>/g,'').replace(/<\/kml>/g,'');
            var xRoot = new XML (xString);
            kmlFile.close();
            pmRows = xRoot.Placemark.length();
            
            var xData = "";
            for (p = 0; p < pmRows; p++) { 
                if (xRoot.Placemark[p].LineString.coordinates.toString() !==""){
                    xData = xRoot.Placemark[p].LineString.coordinates;
                } else {
                    xData = xRoot.Placemark[p].Point.coordinates;
                    
                }
                xData = xData.toString().replace(/^\s+/, ""); // remove leading white space
                array = xData.split(" ");
                rows = array.length;
                
                var earth = 6371010.1 ; // radius of earth (google earth value)
                vertices = [];  // reset vertices
                sa = array[0].split(","); // first point
                sx = parseFloat(sa[0]); // starting point  x (lon)
                sy =  parseFloat(sa[1]); // starting point  y (lat)
                sz =  0; // starting point  z (no altitude provided - amount over sea level)
            
                if (xRoot.Placemark[p].LineString.coordinates.toString() !==""){
                    var ox, oy, oz, olon, olat;
                    adj =   Math.cos((sy * Math.PI / 180)) * earth; // adjacent angle of starting lat
                    
                    for(i=0; i < rows; i++) { // cycle all points
                        inar = array[i].split(","); // split x,y,z
                        if (!isNaN(parseFloat(inar[0]))) {
                            lon = inar[0]; // lon value
                            lat = inar[1];  // lat value
                            overlay = Math.PI * (adj * 2); // overlay width & height (projected flat surface to curved globe)
                            x = (lon + 180) * (overlay / 360); // calculate x from lon to AE/GES world space
                            latRad = lat * Math.PI / 180;  // calcuate latitude in radians (degrees to radians)
                            merc = Math.log(Math.tan((Math.PI / 4) + (latRad / 2))); // calcuate to Mercator projection value
                            y = (overlay / 2) - (overlay * merc / (2 * Math.PI)); // fit Mercator value onto overlay

                            if (i === 0) { // set zero point (for placment)
                                sx = x; // start (x)
                                sy = y; // start (x)
                                olon = lon; // origin lon
                                olat = lat; // origin lat
                                phi = (90 - lat) * (Math.PI / 180);
                                theta = (lon + 180) * (Math.PI / 180);
                                ox = ((earth) * Math.sin(phi) * Math.cos(theta)); // origin points on 3D earth
                                oy = ((earth) * Math.sin(phi) * Math.sin(theta));
                                oz = ((earth) * Math.cos(phi));
                            }
                            vertices.push([(x - sx), (y - sy)]); // position, relative to start position (0,0)
                        } 
                    }
                    t1 = []; // empty tangents
                    t2 = [];
                    pathShapeLayer = app.project.activeItem.layers.addShape(); 
                    pathShapeGroup = pathShapeLayer.property("ADBE Root Vectors Group");  // select the vector shapes PropertyGroup object
                    pathShapeGroup.addProperty("ADBE Vector Shape - Group"); // add a path
                    pathShapeGroup.addProperty("ADBE Vector Graphic - Stroke"); // add a stroke
                    var pathShape = new Shape();  // create shape
                    pathShape.vertices = vertices; // set the path (verticies)
                    pathShape.inTangents = t1; // set tangents to empty
                    pathShape.outTangents = t2;
                    pathShape.closed = false; // don't auto close the path
                    pathShapeLayer.threeDLayer = true;  // put shape in 3D space
                    pathShapeLayer.position.setValue([ox, oy, oz]); // set start of shape to first point
                    pathShapeLayer.orientation.setValue([270,((-90) - olon) , 0]); // set orentiation 
                    pathShapeLayer.xRotation.setValue(-1 * olat); // rotate x to first latitude
                    // set the value of the path too the shape object
                    pathShapeGroup.property(1).property("ADBE Vector Shape").setValue(pathShape); // put the path in the shape group
                } else if (xRoot.Placemark[p].Point.coordinates.toString() !=="") {
                    adj =   Math.cos((sy * Math.PI / 180)) * earth; // adjacent angle of starting lat
                    lon = sx; // lon value
                    lat = sy;  // lat value
                    phi = (90 - lat) * (Math.PI / 180);
                    theta = (lon + 180) * (Math.PI / 180);
                    ox = -((earth) * Math.sin(phi) * Math.cos(theta));
                    oy = -((earth) * Math.sin(phi) * Math.sin(theta));
                    oz = ((earth) * Math.cos(phi));

                    var newNull = app.project.activeItem.layers.addNull();
                    newNull.threeDLayer = true;
                    newNull.position.setValue([ox, oy, oz]); // set position of null to origin lat/lon - altitude set to sea level
                    newNull.orientation.setValue([270, ((-90) - lon), 0]); // set orentiation 
                    newNull.xRotation.setValue(-1 * lat); // rotate x to latitude
                }
            }
        }
    }
    doDrawKmlPath(this);
}