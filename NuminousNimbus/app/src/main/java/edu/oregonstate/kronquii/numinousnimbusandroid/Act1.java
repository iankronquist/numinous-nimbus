package edu.oregonstate.kronquii.numinousnimbusandroid;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.os.AsyncTask;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.view.View.OnClickListener;


import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;

import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;
import org.json.JSONException;
import org.json.JSONObject;


public class Act1 extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_act1);
        Log.d("Act1", "logging1");
        Button btn = (Button) findViewById(R.id.button1);
        // because we implement OnClickListener we only have to pass "this"
        // (much easier)
        new GetReqTask();
        btn.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
                new GetReqTask().execute("abcd");
            }
        });

    }

}

class GetReqTask extends AsyncTask<String, Void, String> {

    private Exception exception;


    protected String doInBackground(String... urls) {
        Log.d("async", "logging -2");
        HttpClient httpClient;
        JSONObject jsonObj;
        Log.d("async", "logging -2.1");
        // Creating HTTP client
        try {
            httpClient = new DefaultHttpClient();
            Log.d("async", "logging -1");
        }
        catch(Exception e) {
            Log.d("async", "logging -1.5");
            return "nope";

        }

        // Creating HTTP Post
        HttpPost httpPost = new HttpPost(
                "http://www.example.com/login");
        Log.d("async", "logging 0");

        // Building post parameters
        // key and value pair
        List<NameValuePair> nameValuePair = new ArrayList<NameValuePair>(2);
        nameValuePair.add(new BasicNameValuePair("email", "user@gmail.com"));
        nameValuePair.add(new BasicNameValuePair("message",
                "Hi, trying Android HTTP post!"));
        Log.d("async", "logging 1");

        // Url Encoding the POST parameters
        try {
            Log.d("async", "logging 2");

            httpPost.setEntity(new UrlEncodedFormEntity(nameValuePair));
            Log.d("async", "logging 3");

        } catch (UnsupportedEncodingException e) {
            // writing error to Log
            e.printStackTrace();
        }
        Log.d("async", "logging 4");

        // Making HTTP Request
        try {
            HttpResponse response = httpClient.execute(httpPost);
            String content = EntityUtils.toString(response.getEntity());
            Log.d("async", "logging 5" + content);
            if (content != null) {
                jsonObj = new JSONObject(content);
            }

            Log.d("async", "logging 6"+response.toString());
        } catch (ClientProtocolException e) {
            // writing exception to log
            e.printStackTrace();
        } catch (IOException e) {
            // writing exception to log
            e.printStackTrace();

        } catch (JSONException e) {
            e.printStackTrace();
        }
        Log.d("async", "logging 8");

        return "done?";
    }

    protected void onPostExecute(String feed) {
        // TODO: check this.exception
        // TODO: do something with the feed
    }
}