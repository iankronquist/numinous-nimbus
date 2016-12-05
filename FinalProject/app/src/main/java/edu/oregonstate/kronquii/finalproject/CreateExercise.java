package edu.oregonstate.kronquii.finalproject;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.AsyncTask;
import android.support.v4.app.ActivityCompat;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.protocol.HTTP;
import org.apache.http.protocol.HttpContext;
import org.apache.http.util.EntityUtils;
import org.json.JSONObject;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

public class CreateExercise extends AppCompatActivity {

    String URL;
    String auth_token;
    String username;
    String location;
    LocationManager mlocManager;
    LocationListener mlocListener = new MyLocationListener();


    public class MyLocationListener implements LocationListener {
        @Override
        public void onLocationChanged(Location loc) {
            Log.d("gps","Location changed");
            // Output accuracy
            if (loc.getAccuracy() < 50) {
                // After GPS reaches adequate accuracy load details page and stop GPS
                Toast.makeText(getApplicationContext(), "Loading GPS location",
                        Toast.LENGTH_LONG).show();

                // pass lat and long to loadCoordinates
                //LatLng userCoordinates = new LatLng(loc.getLatitude(), loc.getLongitude());
                //loadCoordinates(userCoordinates);
                Log.d("gps","Location accurate");

                location = loc.getLatitude() + " " + loc.getLongitude();
                requestPermissions(new String[]{Manifest.permission.CAMERA,
                            Manifest.permission.WRITE_EXTERNAL_STORAGE}, 0);
                // If we got here we already have permission.
                //mlocManager.removeUpdates(mlocListener);
            }

        }

        // Required
        public void onProviderDisabled(String provider) {
        }

        public void onProviderEnabled(String provider) {
        }

        public void onStatusChanged(String provider, int status, Bundle extras) {
        }
    }

    /* Main activity functions */

    /*
    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           String permissions[], int[] grantResults) {
        switch (requestCode) {
            case 0: {
                // If request is cancelled, the result arrays are empty.
                if (grantResults.length > 0
                        && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    mlocManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0, mlocListener);


                } else {


                }
                return;
            }

            // other 'case' lines to check for other
            // permissions this app might request
        }
    }
    */

    private Location getBestLastKnownLocation() {
        mlocManager = (LocationManager)getApplicationContext().getSystemService(LOCATION_SERVICE);
        List<String> providers = mlocManager.getProviders(true);
        Log.d("gps","Getting best known location");

        Location bestLocation = null;
        for (String provider : providers) {
            Location l = mlocManager.getLastKnownLocation(provider);
            if (l == null) {
                continue;
            }
            if (bestLocation == null || l.getAccuracy() < bestLocation.getAccuracy()) {
                // Found best last known location: %s", l);
                bestLocation = l;
            }
        }
        if(bestLocation != null) {
            Log.d("gps","found acceptable location");
        } else {
            Log.d("gps","No acceptable location");
        }
        return bestLocation;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_create_exercise);

        Button createButton;
        final EditText weightField;
        final EditText timeField;

        mlocManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 0);

        }
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED || ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            Log.d("gps","starting location manager");

            mlocManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0, mlocListener);
            Location loc = getBestLastKnownLocation();
            if (loc != null) {
                Log.d("gps","Got last known location");
                location = loc.getLatitude() + " " + loc.getLongitude();
            }
        }



        createButton = (Button) findViewById(R.id.create);
        weightField = (EditText) findViewById(R.id.weightField);
        timeField = (EditText) findViewById(R.id.dateField);

        Intent intent = getIntent();
        URL = intent.getExtras().getString("URL");
        auth_token = intent.getExtras().getString("auth_token");
        username = intent.getExtras().getString("username");


        createButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {

                Long weight = Long.valueOf(weightField.getText().toString());

                DateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy");
                Date inputDate;
                Long unixdate;
                try {
                    inputDate = dateFormat.parse(timeField.getText().toString());
                    unixdate = inputDate.getTime();
                }
                catch (Exception e) {
                    Toast.makeText(CreateExercise.this, "Invalid date.", Toast.LENGTH_LONG).show();
                    Log.d("date", "Problem with date " + e.getMessage());
                    return;
                }

                new LoginTask().execute(weight, unixdate);
                Toast.makeText(CreateExercise.this, "Creating Exercise...", Toast.LENGTH_LONG).show();

            }
        });
    }

    class LoginTask extends AsyncTask<Long, Void, Boolean> {

        String message;


        protected Boolean doInBackground(Long... params) {
            try {
                HttpPost httpPost = new HttpPost(URL + "/create");
                HttpClient httpClient = new DefaultHttpClient();
                HttpContext localContext = new BasicHttpContext();
                httpPost.addHeader("content-type", "application/json");
                JSONObject jsonObj = new JSONObject();

                jsonObj.put("username", username);
                jsonObj.put("auth_token", auth_token);
                jsonObj.put("weight", params[0]);
                jsonObj.put("time", params[1]);
                jsonObj.put("location", location);



                String jsonStr = jsonObj.toString();
                Log.d("jsonsent", jsonStr);
                httpPost.setEntity(new StringEntity(jsonStr, HTTP.UTF_8));

                final HttpResponse response = httpClient.execute(httpPost, localContext);
                final String response_string = EntityUtils.toString(response.getEntity());
                Log.d("response", response_string);
                JSONObject resp = new JSONObject(response_string);
                if (response.getStatusLine().getStatusCode() == 200) {
                    message = resp.getString("message");
                    return true;

                } else {
                    message = resp.getString("error");
                    return false;
                }

            } catch (Exception e) {
                e.printStackTrace();
                //Toast.makeText(CreateExercise.this, "Error creating. Connect to the internet, or try again later.", Toast.LENGTH_LONG).show();
                Log.d("PostFailure", "failed to do something " + e.toString());
                return false;
            }
        }

        protected void onPostExecute(Boolean transition) {
            Intent goToNextActivity = new Intent(getApplicationContext(), List2.class);

            goToNextActivity.putExtra("auth_token", auth_token);
            goToNextActivity.putExtra("URL", URL);
            goToNextActivity.putExtra("username", username);
            startActivity(goToNextActivity);

        }

    }
}
