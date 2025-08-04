
import java.io.*;
import java.util.*;

class Student {
    String id, name;
    int age;

    Student(String id, String name, int age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }

    public String toString() {
        return id + "," + name + "," + age;
    }
}

public class StudentManagement {
    static final String FILE = "students.txt";

    public static void addStudent(Student s) throws IOException {
        BufferedWriter bw = new BufferedWriter(new FileWriter(FILE, true));
        bw.write(s.toString());
        bw.newLine();
        bw.close();
    }

    public static void viewStudents() throws IOException {
        BufferedReader br = new BufferedReader(new FileReader(FILE));
        String line;
        System.out.println("\nAll Students:");
        while ((line = br.readLine()) != null) {
            System.out.println(line);
        }
        br.close();
    }

    public static void deleteStudentById(String id) throws IOException {
        File inputFile = new File(FILE);
        File tempFile = new File("temp.txt");

        BufferedReader br = new BufferedReader(new FileReader(inputFile));
        BufferedWriter bw = new BufferedWriter(new FileWriter(tempFile));

        String line;
        boolean found = false;

        while ((line = br.readLine()) != null) {
            if (!line.startsWith(id + ",")) {
                bw.write(line);
                bw.newLine();
            } else {
                found = true;
            }
        }
        br.close();
        bw.close();

        inputFile.delete();
        tempFile.renameTo(inputFile);

        if (found) {
            System.out.println("Student with ID " + id + " deleted.");
        } else {
            System.out.println("Student not found.");
        }
    }

    public static void searchByName(String name) throws IOException {
        BufferedReader br = new BufferedReader(new FileReader(FILE));
        String line;
        boolean found = false;

        System.out.println("\nSearch results for name: " + name);
        while ((line = br.readLine()) != null) {
            if (line.toLowerCase().contains(name.toLowerCase())) {
                System.out.println(line);
                found = true;
            }
        }
        if (!found) {
            System.out.println("No matching student found.");
        }
        br.close();
    }

    public static void main(String[] args) throws IOException {
        Scanner sc = new Scanner(System.in);
        int choice;

        while (true) {
            System.out.println("\n==== Student Record Management ====");
            System.out.println("1. Add Student");
            System.out.println("2. View All Students");
            System.out.println("3. Delete Student by ID");
            System.out.println("4. Search Student by Name");
            System.out.println("5. Exit");
            System.out.print("Enter choice: ");
            choice = sc.nextInt();

            switch (choice) {
                case 1:
                    System.out.print("Enter ID: ");
                    String id = sc.next();
                    System.out.print("Enter Name: ");
                    String name = sc.next();
                    System.out.print("Enter Age: ");
                    int age = sc.nextInt();
                    addStudent(new Student(id, name, age));
                    break;
                case 2:
                    viewStudents();
                    break;
                case 3:
                    System.out.print("Enter ID to delete: ");
                    String delId = sc.next();
                    deleteStudentById(delId);
                    break;
                case 4:
                    System.out.print("Enter name to search: ");
                    String searchName = sc.next();
                    searchByName(searchName);
                    break;
                case 5:
                    System.out.println("Exiting...");
                    System.exit(0);
                default:
                    System.out.println("Invalid choice.");
            }
        }
    }
}

    

