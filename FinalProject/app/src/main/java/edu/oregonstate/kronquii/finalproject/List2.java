package edu.oregonstate.kronquii.finalproject;

import android.app.ListActivity;
import android.content.Intent;
import android.os.AsyncTask;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
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
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Iterator;

class ExerciseEntry {
    public Long time, weight;
    public Integer id;
    public String location;
    ExerciseEntry(Long time, Long weight, Integer id, String location) {
        this.time = time;
        this.weight = weight;
        this.id = id;
        this.location = location;
    }

}

public class List2 extends ListActivity {

    ArrayList<String> listItems=new ArrayList<>();
    ArrayList<ExerciseEntry> ids=new ArrayList<>();

    ArrayAdapter<String> adapter;
    int clickCounter=0;
    String URL;
    String username;
    String auth_token;


    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        new ListTask().execute(URL, username, auth_token);
    }

    public void logout(View v) {
        URL = "";
        username = "";
        auth_token = "";
        Intent goToNextActivity = new Intent(getApplicationContext(), Login.class);

        goToNextActivity.putExtra("auth_token", "");
        goToNextActivity.putExtra("URL", "");
        goToNextActivity.putExtra("username", "");
        startActivity(goToNextActivity);
    }



    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_list2);
        adapter=new ArrayAdapter<String>(this,
                android.R.layout.simple_list_item_1,
                listItems);
        setListAdapter(adapter);
        Intent intent = getIntent();
        URL = intent.getExtras().getString("URL");
        auth_token = intent.getExtras().getString("auth_token");
        username = intent.getExtras().getString("username");

        Button createButton = (Button) findViewById(R.id.addBtn);

        createButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Toast.makeText(List2.this, "Creating in...", Toast.LENGTH_LONG).show();
                Intent goToNextActivity = new Intent(getApplicationContext(), CreateExercise.class);
                goToNextActivity.putExtra("auth_token", auth_token);
                goToNextActivity.putExtra("URL", URL);
                goToNextActivity.putExtra("username", username);
                startActivity(goToNextActivity);
            }
        });

        final ListView lv = (ListView)findViewById(android.R.id.list);
        lv.setClickable(true);
        lv.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            public void onItemClick(AdapterView<?> arg0, View arg1, int position, long arg3) {
                Object o = lv.getItemAtPosition(position);
                Log.d("here", "clicked!");

            }
        });

        new ListTask().execute(URL, username, auth_token);
    }

    class ListTask extends AsyncTask<String, Void, Boolean> {
        String message;
        protected Boolean doInBackground(String... params) {
            try {
                HttpPost httpPost = new HttpPost(params[0] + "/list");
                HttpClient httpClient = new DefaultHttpClient();
                HttpContext localContext = new BasicHttpContext();
                httpPost.addHeader("content-type", "application/json");
                JSONObject jsonObj = new JSONObject();

                jsonObj.put("username", params[1]);
                jsonObj.put("auth_token", params[2]);
                String jsonStr = jsonObj.toString();

                httpPost.setEntity(new StringEntity(jsonStr, HTTP.UTF_8));

                final HttpResponse response = httpClient.execute(httpPost, localContext);
                final String response_string = EntityUtils.toString(response.getEntity());
                Log.d("response", response_string);

                JSONObject resp = new JSONObject(response_string);
                if (response.getStatusLine().getStatusCode() == 200) {
                    try {
                        JSONObject items = resp.getJSONObject("items");
                        Iterator<String> keys = items.keys();

                        while(keys.hasNext()) {
                            String key = (String)keys.next();
                            if (items.get(key) instanceof JSONObject) {
                                JSONObject exercise = items.getJSONObject(key);
                                Long time = exercise.getLong("time");
                                Long weight = exercise.getLong("weight");
                                String entry = "Lifted " + weight + " pounds on " + time;

                                Integer id;
                                String location = "";
                                try {
                                    location = exercise.getString("location");
                                    if (location != "") {
                                        entry += " at " + location;
                                    }

                                }
                                catch (Exception e) {}
                                try {
                                    id = new Integer(key);
                                }
                                catch (Exception e) {
                                    return false;
                                }
                                listItems.add(entry);
                                ids.add(new ExerciseEntry(time, weight, id, location));
                            }
                        }
                        adapter.notifyDataSetChanged();

                    } catch (Exception e) {

                    }
                    message = resp.getString("message");
                    return true;
                } else {
                    message = resp.getString("error");
                    return false;
                }
            } catch (Exception e) {
                e.printStackTrace();
                Toast.makeText(List2.this, "Error logging in. Connect to the internet, or try again later.", Toast.LENGTH_LONG).show();
                Log.d("PostFailure", "failed to do something " + e.toString());
                return false;
            }
        }

        protected void onPostExecute(Boolean transition) {
            //TextView output;
            //output = (TextView) findViewById(R.id.statusText);
            //output.setText(message);
            adapter.notifyDataSetChanged();
        }
    }
}