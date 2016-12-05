package edu.oregonstate.kronquii.finalproject;

import android.os.AsyncTask;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
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

public class list extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_list);
    }

    class ListTask extends AsyncTask<String, Void, String> {
        String URL;
        String auth_token;
        protected String doInBackground(String... params) {
            try {
                HttpPost httpPost = new HttpPost(URL + "/list");
                HttpClient httpClient = new DefaultHttpClient();
                HttpContext localContext = new BasicHttpContext();
                httpPost.addHeader("content-type", "application/json");
                JSONObject jsonObj = new JSONObject();

                jsonObj.put("username", params[2]);
                jsonObj.put("auth_token", params[3]);
                String jsonStr = jsonObj.toString();
                Log.d("jsonsent", jsonStr);
                httpPost.setEntity(new StringEntity(jsonStr, HTTP.UTF_8));

                final HttpResponse response = httpClient.execute(httpPost, localContext);
                final String response_string = EntityUtils.toString(response.getEntity());
                Log.d("response", response_string);

                JSONObject resp = new JSONObject(response_string);
                String message;
                if (response.getStatusLine().getStatusCode() == 200) {
                    auth_token = resp.getString("key");
                    message = resp.getString("message");
                } else {
                    message = resp.getString("error");
                }
                return message;
            } catch (Exception e) {
                e.printStackTrace();
                Toast.makeText(list.this, "Error logging in. Connect to the internet, or try again later.", Toast.LENGTH_LONG).show();
                Log.d("PostFailure", "failed to do something " + e.toString());
                return "";
            }
        }

        protected void onPostExecute(String message) {
            TextView output;
            output = (TextView) findViewById(R.id.statusText);
            output.setText(message);
        }
    }
}
