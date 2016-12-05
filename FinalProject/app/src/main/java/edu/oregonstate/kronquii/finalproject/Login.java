package edu.oregonstate.kronquii.finalproject;

import android.content.Intent;
import android.os.AsyncTask;
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

public class Login extends AppCompatActivity {
    String auth_token;
    String username;
    //final String URL = "http://numinous-nimbus.heroku.com/";
    final String URL = "http://192.168.43.114:8888";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        Button loginButton;
        Button signupButton;
        final EditText passwordField;
        final EditText usernameField;

        loginButton = (Button) findViewById(R.id.loginButton);
        signupButton = (Button) findViewById(R.id.signupButton);
        usernameField = (EditText) findViewById(R.id.usernameField);
        passwordField = (EditText) findViewById(R.id.passwordField);


        loginButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Toast.makeText(Login.this, "Logging in...", Toast.LENGTH_LONG).show();
                username = usernameField.getText().toString();

                new LoginTask().execute(usernameField.getText().toString(), passwordField.getText().toString());
            }
        });

        signupButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {

                Toast.makeText(Login.this, "Signing up...", Toast.LENGTH_LONG).show();
                username = usernameField.getText().toString();

                new SignUpTask().execute(usernameField.getText().toString(), passwordField.getText().toString());

            }
        });
    }


    class LoginTask extends AsyncTask<String, Void, Boolean> {

        String message;
        protected Boolean doInBackground(String... params) {
            try {
                HttpPost httpPost = new HttpPost(URL + "/login");
                HttpClient httpClient = new DefaultHttpClient();
                HttpContext localContext = new BasicHttpContext();
                httpPost.addHeader("content-type", "application/json");
                JSONObject jsonObj = new JSONObject();

                jsonObj.put("username", params[0]);
                jsonObj.put("password", params[1]);
                String jsonStr = jsonObj.toString();
                Log.d("jsonsent", jsonStr);
                httpPost.setEntity(new StringEntity(jsonStr, HTTP.UTF_8));

                final HttpResponse response = httpClient.execute(httpPost, localContext);
                final String response_string = EntityUtils.toString(response.getEntity());
                Log.d("response", response_string);
                JSONObject resp = new JSONObject(response_string);
                if (response.getStatusLine().getStatusCode() == 200) {
                    auth_token = resp.getString("key");
                    message = resp.getString("message");
                    return true;

                } else {
                    message = resp.getString("error");
                    return false;
                }

            } catch (Exception e) {
                e.printStackTrace();
                Toast.makeText(Login.this, "Error logging in. Connect to the internet, or try again later.", Toast.LENGTH_LONG).show();
                Log.d("PostFailure", "failed to do something " + e.toString());
                return false;
            }
        }

        protected void onPostExecute(Boolean transition) {
            TextView output;
            Log.d("done", "on exe");

            output = (TextView) findViewById(R.id.statusText);
            output.setText(message);
            if (transition) {
                Intent goToNextActivity = new Intent(getApplicationContext(), List2.class);
                goToNextActivity.putExtra("auth_token", auth_token);
                goToNextActivity.putExtra("URL", URL);
                goToNextActivity.putExtra("username", username);

                Log.d("done", "going to list view");
                startActivity(goToNextActivity);
            }
        }
    }

    class SignUpTask extends AsyncTask<String, Void, Boolean> {
        String message;
        protected Boolean doInBackground(String... params) {
            try {
                HttpPost httpPost = new HttpPost(URL + "/signup");
                HttpClient httpClient = new DefaultHttpClient();
                HttpContext localContext = new BasicHttpContext();
                httpPost.addHeader("content-type", "application/json");
                JSONObject jsonObj = new JSONObject();

                jsonObj.put("username", params[0]);
                jsonObj.put("password", params[1]);
                String jsonStr = jsonObj.toString();
                Log.d("jsonsent", jsonStr);
                httpPost.setEntity(new StringEntity(jsonStr, HTTP.UTF_8));

                final HttpResponse response = httpClient.execute(httpPost, localContext);
                final String response_string = EntityUtils.toString(response.getEntity());
                Log.d("response", response_string);

                JSONObject resp = new JSONObject(response_string);
                if (response.getStatusLine().getStatusCode() == 200) {
                    auth_token = resp.getString("key");
                    message = resp.getString("message");
                    return true;
                } else {
                    message = resp.getString("error");
                    return false;
                }
            } catch (Exception e) {
                e.printStackTrace();
                Toast.makeText(Login.this, "Error logging in. Connect to the internet, or try again later.", Toast.LENGTH_LONG).show();
                Log.d("PostFailure", "failed to do something " + e.toString());
                return false;
            }
        }

        protected void onPostExecute(Boolean transition) {
                TextView output;
                output = (TextView) findViewById(R.id.statusText);
                output.setText(message);
            if (transition) {
                Intent goToNextActivity = new Intent(getApplicationContext(), List2.class);
                goToNextActivity.putExtra("auth_token", auth_token);
                goToNextActivity.putExtra("URL", URL);
                goToNextActivity.putExtra("username", username);

                Log.d("done", "going to list view");
                startActivity(goToNextActivity);
            }
        }
    }
}