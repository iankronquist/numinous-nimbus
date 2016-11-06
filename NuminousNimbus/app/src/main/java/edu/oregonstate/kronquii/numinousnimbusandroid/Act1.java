package edu.oregonstate.kronquii.numinousnimbusandroid;

import android.Manifest;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import android.support.v4.content.FileProvider;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.os.AsyncTask;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.view.View.OnClickListener;


import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;


import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.protocol.HttpContext;


import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.entity.mime.HttpMultipartMode;
import org.apache.http.entity.mime.content.FileBody;
import org.apache.http.entity.mime.content.StringBody;

import org.apache.http.util.EntityUtils;
import org.json.JSONObject;
import org.w3c.dom.Text;

import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;

import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;

import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

public class Act1 extends Activity {
    private static final int TAKE_PICTURE = 1;
    private Uri imageUri;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.d("TakePicture", "logging-----------------------------------------");

        final String dir;
        File newdir;
        Button postButton;
        Button photoButton;
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_act1);


        postButton = (Button) findViewById(R.id.postButton);
        postButton.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {
                Toast.makeText(Act1.this, "Uploading...", Toast.LENGTH_LONG).show();
                new PostToImgur().execute("Pic.jpg");
            }
        });

        photoButton = (Button) findViewById(R.id.photoButton);
        photoButton.setOnClickListener(new OnClickListener() {
            public void onClick(View v) {

                takePhoto(v);
            }

        });
    }

    public void takePhoto(View view) {
        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED ||
                checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) !=
                        PackageManager.PERMISSION_GRANTED) {

            requestPermissions(new String[]{Manifest.permission.CAMERA,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE}, 0);

        } /*else {
            Toast.makeText(Act1.this,
                    "Okay, but we can't really do much without those permissions",
                    Toast.LENGTH_LONG).show();
        }*/



        try {
            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            File photo = new File(Environment.getExternalStorageDirectory(), "Pictures/Pic.jpg");
            photo.getParentFile().mkdirs();
            new FileOutputStream(photo).close();
            imageUri = FileProvider.getUriForFile(Act1.this,
                    BuildConfig.APPLICATION_ID + ".provider", photo);
            intent.putExtra(MediaStore.EXTRA_OUTPUT,
                    imageUri);
            startActivityForResult(intent, TAKE_PICTURE);
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(Act1.this, "Uh oh! Looks like we had a problem", Toast.LENGTH_LONG).show();

        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        switch (requestCode) {
            case TAKE_PICTURE:
                if (resultCode == Activity.RESULT_OK) {
                    Button postButton;
                    Uri selectedImage = imageUri;
                    getContentResolver().notifyChange(selectedImage, null);
                    ImageView imageView = (ImageView) findViewById(R.id.image);
                    ContentResolver cr = getContentResolver();
                    Bitmap bitmap;
                    try {
                        bitmap = android.provider.MediaStore.Images.Media
                                .getBitmap(cr, selectedImage);

                        imageView.setImageBitmap(bitmap);
                        Toast.makeText(this, selectedImage.toString(),
                                Toast.LENGTH_LONG).show();
                    } catch (Exception e) {
                        Toast.makeText(this, "Failed to load", Toast.LENGTH_SHORT)
                                .show();
                        Log.e("Camera", e.toString());
                    }
                    postButton = (Button) findViewById(R.id.postButton);
                    postButton.setEnabled(true);
                }
        }
    }


    class PostToImgur extends AsyncTask<String, Void, Boolean> {

        private Exception exception;
        String imageName;


        protected Boolean doInBackground(String... files) {
            final String upload_to = "https://api.imgur.com/3/upload.json";
            final String API_key = "e4d31dbb14e259fa15db0878bb1ae5def4075fb0";
            final String clientId = "669c016e544468d";


            HttpClient httpClient = new DefaultHttpClient();
            HttpContext localContext = new BasicHttpContext();
            HttpPost httpPost = new HttpPost(upload_to);
            httpPost.addHeader("Authorization", "Client-ID " + clientId);


            try {
                final MultipartEntity entity = new MultipartEntity(
                        HttpMultipartMode.BROWSER_COMPATIBLE);
                File photo = new File(Environment.getExternalStorageDirectory(), "Pictures/Pic.jpg");


                entity.addPart("image", new FileBody(photo));
                entity.addPart("key", new StringBody(API_key));

                httpPost.setEntity(entity);

                final HttpResponse response = httpClient.execute(httpPost, localContext);

                final String response_string = EntityUtils.toString(response
                        .getEntity());

                final JSONObject json = new JSONObject(response_string);
                Log.d("JSON", "received json object:" + json.toString());

                if (response.getStatusLine().getStatusCode() == 200 &&
                        json.getBoolean("success")) {
                    imageName = "https://imgur.com/" + json.getJSONObject("data").getString("id");
                } else {
                    imageName = "Request failed with status " +
                            response.getStatusLine().getStatusCode() + " and error " +
                            json.getString("error");
                }
                return true;


            } catch (Exception e) {
                e.printStackTrace();
                Toast.makeText(Act1.this,
                        "Oops, couldn't upload the image! Make sure you're connected to the internet and try again",
                        Toast.LENGTH_LONG).show();
                Log.d("PostFailure", "failed to do something " + e.toString());
                return false;
            }
        }

        protected void onPostExecute(Boolean feed) {
            TextView output;
            output = (TextView) findViewById(R.id.output);
            output.setText(imageName);
        }
    }
}
